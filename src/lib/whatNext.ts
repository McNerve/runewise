/**
 * Account-aware "What next" suggestions for Home.
 * Pure: no React, no I/O. At most three actions ranked by leverage.
 */
import type { HiscoreData } from "./api/hiscores";
import type { View } from "./features";
import { MONEY_METHODS } from "./data/money-methods";

export interface WhatNextAction {
  id: string;
  title: string;
  reason: string;
  view: View;
  params?: Record<string, string>;
  /** Accent hint for UI: combat | money | train | live | setup */
  kind: "combat" | "money" | "train" | "live" | "setup";
}

function skillLevel(data: HiscoreData, name: string): number {
  return data.skills.find((s) => s.name.toLowerCase() === name.toLowerCase())?.level ?? 1;
}

function skillXp(data: HiscoreData, name: string): number {
  return data.skills.find((s) => s.name.toLowerCase() === name.toLowerCase())?.xp ?? 0;
}

/** Nearest non-maxed combat-adjacent skill under 99 with the most "room" to grow. */
function bestTrainingTarget(data: HiscoreData): { name: string; level: number } | null {
  const combatSkills = ["Attack", "Strength", "Defence", "Ranged", "Magic", "Prayer", "Hitpoints"];
  const candidates = combatSkills
    .map((name) => ({ name, level: skillLevel(data, name) }))
    .filter((s) => s.level < 99)
    .sort((a, b) => a.level - b.level);
  return candidates[0] ?? null;
}

/** Highest GP/hr money method the account can do. */
function bestMoneyMethod(data: HiscoreData): { name: string; gp: number } | null {
  let best: { name: string; gp: number } | null = null;
  for (const m of MONEY_METHODS) {
    const ok = m.skills.every((req) => skillLevel(data, req.name) >= req.level);
    if (!ok) continue;
    if (!best || m.baseGpPerHr > best.gp) {
      best = { name: m.name, gp: m.baseGpPerHr };
    }
  }
  return best;
}

function hasBossKc(data: HiscoreData): boolean {
  return (data.activities ?? []).some((a) => a.score > 0 && a.id >= 20);
}

function combatLevelApprox(data: HiscoreData): number {
  const get = (n: string) => skillLevel(data, n);
  const base = 0.25 * (get("Defence") + get("Hitpoints") + Math.floor(get("Prayer") / 2));
  const melee = 0.325 * (get("Attack") + get("Strength"));
  const range = 0.325 * (Math.floor(get("Ranged") / 2) + get("Ranged"));
  const magic = 0.325 * (Math.floor(get("Magic") / 2) + get("Magic"));
  return Math.floor(base + Math.max(melee, range, magic));
}

export interface WhatNextInput {
  rsn: string | null;
  hiscores: HiscoreData | null;
  /** Active farm timers count from local storage. */
  activeFarmTimers?: number;
  /** Live shooting stars count. */
  liveStarCount?: number;
  ironmanMode?: boolean;
}

/**
 * Build up to 3 ranked next actions. Empty only when there is nothing useful
 * to say (no RSN and no live signals).
 */
export function buildWhatNext(input: WhatNextInput): WhatNextAction[] {
  const actions: WhatNextAction[] = [];
  const { rsn, hiscores, activeFarmTimers = 0, liveStarCount = 0, ironmanMode } = input;

  // Live signals first when urgent
  if (activeFarmTimers > 0) {
    actions.push({
      id: "farm-timers",
      title: "Check farm timers",
      reason: `${activeFarmTimers} active timer${activeFarmTimers === 1 ? "" : "s"} running`,
      view: "timers",
      kind: "live",
    });
  }
  if (liveStarCount > 0) {
    actions.push({
      id: "stars",
      title: "Shooting stars are up",
      reason: `${liveStarCount} live call${liveStarCount === 1 ? "" : "s"} right now`,
      view: "stars",
      kind: "live",
    });
  }

  if (!rsn || !hiscores) {
    actions.push({
      id: "set-rsn",
      title: "Set your RSN",
      reason: "Unlock personalized training, money, and combat suggestions",
      view: "overview",
      kind: "setup",
    });
    // Generic combat entry for cold starts
    actions.push({
      id: "open-loadout-finder",
      title: "Find a budget loadout",
      reason: "Monster + budget → best preset DPS",
      view: "loadout-finder",
      kind: "combat",
    });
    return actions.slice(0, 3);
  }

  const cb = combatLevelApprox(hiscores);
  const train = bestTrainingTarget(hiscores);
  const money = bestMoneyMethod(hiscores);
  const slayer = skillLevel(hiscores, "Slayer");

  // Combat: mid-game+ players → budget finder (then open full DPS)
  if (cb >= 70) {
    actions.push({
      id: "dps-upgrades",
      title: hasBossKc(hiscores) ? "Best gear under budget" : "Find a budget loadout",
      reason: hasBossKc(hiscores)
        ? "Rank presets by DPS for your cash stack"
        : `Combat ${cb} — monster + budget → best setup`,
      view: "loadout-finder",
      kind: "combat",
    });
  }

  // Training path
  if (train) {
    actions.push({
      id: "train-skill",
      title: `Train ${train.name}`,
      reason: `Level ${train.level} — path to 99 in the skill calculator`,
      view: "skill-calc",
      params: { skill: train.name },
      kind: "train",
    });
  }

  // Money (skip aggressive GE tips for ironmen)
  if (money && !ironmanMode) {
    const gpLabel =
      money.gp >= 1_000_000
        ? `${(money.gp / 1_000_000).toFixed(1)}M`
        : `${Math.round(money.gp / 1000)}K`;
    actions.push({
      id: "money",
      title: "Best money for you",
      reason: `${money.name} · ~${gpLabel} gp/hr at your levels`,
      view: "money-making",
      params: { tab: "rankings", forMe: "1" },
      kind: "money",
    });
  } else if (ironmanMode) {
    actions.push({
      id: "iron-money",
      title: "Skilling profit",
      reason: "Iron-friendly methods and production calcs",
      view: "money-making",
      params: { tab: "methods" },
      kind: "money",
    });
  }

  // Slayer daily driver
  if (slayer >= 50 && actions.length < 3) {
    actions.push({
      id: "slayer",
      title: "Slayer task planning",
      reason: `Slayer ${slayer} — weights, blocks, and unlocks`,
      view: "slayer",
      kind: "combat",
    });
  }

  // Boss content if high combat and no boss action yet
  if (cb >= 100 && !actions.some((a) => a.id === "dps-upgrades") && actions.length < 3) {
    actions.push({
      id: "bosses",
      title: "Browse boss guides",
      reason: "Strategy, loot EV, and deep-link into DPS",
      view: "bosses",
      kind: "combat",
    });
  }

  // Market flips for mid+ accounts with free slots
  if (!ironmanMode && skillXp(hiscores, "Overall") > 10_000_000 && actions.length < 3) {
    actions.push({
      id: "flips",
      title: "Scan GE flips",
      reason: "Tax-aware margins and buy limits",
      view: "market",
      params: { tab: "flips" },
      kind: "money",
    });
  }

  // Dedupe by view+id, cap 3
  const seen = new Set<string>();
  const out: WhatNextAction[] = [];
  for (const a of actions) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    out.push(a);
    if (out.length >= 3) break;
  }
  return out;
}
