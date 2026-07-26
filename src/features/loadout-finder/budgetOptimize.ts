/**
 * Under-budget gear optimizer (GearScape-class search stack).
 *
 * - greedyOptimizeUnderBudget: weapon → armour sequential fill
 * - beamOptimizeUnderBudget: multi-weapon beam + slot-order variants
 * - combinatorialOptimizeUnderBudget: Pareto prune + branch-and-bound DFS
 *   + local 1-swap / limited 2-swap refinement (default)
 */
import type { WikiEquipment, EquipmentSlot } from "../../lib/api/equipment";
import type { HiscoreData } from "../../lib/api/hiscores";
import type { CombatStyle, EquippedGear } from "../dps-calc/dpsTypes";
import { calculateDps } from "../../lib/formulas/dps";
import { knownWeaponSpeed } from "../../lib/data/weapon-speeds";
import {
  buildDpsInput,
  bestPrayerForStyle,
  filterExcludedEquipment,
  resolveSpellLabel,
  withOwnedPrices,
  type LoadoutTarget,
  type RankedLoadout,
} from "./budgetLoadoutFinder";
import type { GearPreset } from "../../lib/data/gear-presets";

const ARMOUR_SLOTS: (EquipmentSlot | "2h")[] = [
  "head",
  "cape",
  "neck",
  "ammo",
  "body",
  "legs",
  "hands",
  "feet",
  "ring",
  "shield",
];

/** Slot fill order variants so beam search escapes greedy local optima. */
const SLOT_ORDERS: (EquipmentSlot | "2h")[][] = [
  ARMOUR_SLOTS,
  // Strength / offence first
  ["neck", "body", "legs", "head", "feet", "hands", "cape", "ring", "shield", "ammo"],
  // Cheap jewellery first (often better value under tight budgets)
  ["ring", "neck", "cape", "hands", "feet", "head", "legs", "body", "shield", "ammo"],
];

function priceOrZero(priceOf: (n: string) => number | null, name: string): number {
  const p = priceOf(name);
  return p != null && p > 0 ? p : 0;
}

function styleOk(item: WikiEquipment, style: CombatStyle): boolean {
  const n = item.name.toLowerCase();
  if (style === "melee") {
    if (n.includes("bow") || n.includes("crossbow") || n.includes("blowpipe")) return false;
    if ((n.includes("staff") || n.includes("trident") || n.includes("wand")) && !n.includes("halberd"))
      return false;
  }
  if (style === "ranged") {
    if (n.includes("scimitar") || n.includes("whip") || n.includes("rapier") || n.includes("scythe"))
      return false;
    if (n.includes("staff") || n.includes("trident") || n.includes("sang") || n.includes("shadow"))
      return false;
  }
  if (style === "magic") {
    if (n.includes("bow") || n.includes("crossbow") || n.includes("whip") || n.includes("rapier"))
      return false;
    if (n.includes("scimitar") || n.includes("scythe") || n.includes("maul")) return false;
  }
  return true;
}

function setupCost(gear: EquippedGear, priceOf: (n: string) => number | null): number {
  let t = 0;
  for (const item of Object.values(gear)) {
    if (item) t += priceOrZero(priceOf, item.name);
  }
  return t;
}

function scoreGear(
  style: CombatStyle,
  gear: EquippedGear,
  hiscores: HiscoreData | null,
  target: LoadoutTarget,
  onTask = false
): { dps: number; maxHit: number; accuracy: number; ttk: number } {
  const input = buildDpsInput(style, gear, hiscores, target, { onTask });
  const r = calculateDps(input);
  return { dps: r.dps, maxHit: r.maxHit, accuracy: r.accuracy, ttk: r.ttk };
}

function offensiveScore(item: WikiEquipment, style: CombatStyle): number {
  if (style === "ranged") return item.attackRanged + item.rangedStrength;
  if (style === "magic") return item.attackMagic + item.magicDamage;
  return Math.max(item.attackSlash, item.attackStab, item.attackCrush) + item.strengthBonus;
}

function toRanked(
  style: CombatStyle,
  gear: EquippedGear,
  hiscores: HiscoreData | null,
  target: LoadoutTarget,
  priceOf: (n: string) => number | null,
  budget: number,
  unlimited: boolean,
  description: string,
  onTask = false
): RankedLoadout | null {
  if (Object.keys(gear).length === 0) return null;
  const scored = scoreGear(style, gear, hiscores, target, onTask);
  const totalCost = setupCost(gear, priceOf);
  const slotsFilled = Object.values(gear).filter(Boolean).length;
  const styleLabel = `${style[0]!.toUpperCase()}${style.slice(1)}`;
  const preset: GearPreset = {
    name: `Optimized ${styleLabel}`,
    style,
    description,
    slots: Object.fromEntries(
      Object.entries(gear)
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, v!.name])
    ),
  };
  const prayerLevel =
    hiscores?.skills.find((s) => s.name.toLowerCase() === "prayer")?.level ?? 99;
  const prayer = bestPrayerForStyle(style, prayerLevel);

  return {
    preset: { ...preset, prayer: prayer.name },
    gear,
    resolvedSlots: slotsFilled,
    missingItems: [],
    totalCost,
    unpricedCount: Object.values(gear).filter((i) => i && priceOrZero(priceOf, i.name) === 0).length,
    dps: scored.dps,
    maxHit: scored.maxHit,
    accuracy: scored.accuracy,
    ttk: scored.ttk,
    style,
    withinBudget: unlimited || totalCost <= budget,
    prayerName: prayer.name,
    spellName: resolveSpellLabel(style, gear, hiscores),
  };
}

export interface BudgetOptimizeOptions {
  equipment: WikiEquipment[];
  priceOf: (itemName: string) => number | null;
  hiscores: HiscoreData | null;
  target: LoadoutTarget;
  budget: number;
  style: CombatStyle;
  /** Cap candidates scanned per slot (perf). */
  perSlot?: number;
  /** Beam width: top partial loadouts kept per stage. Default 6. */
  beamWidth?: number;
  /** Top weapon seeds for beam/combinatorial search. Default 5 / 10. */
  weaponSeeds?: number;
  /**
   * Max full DPS evaluations for combinatorial branch-and-bound.
   * Default 40_000 — enough for high-quality search in the browser.
   */
  maxEvals?: number;
  /** Skip local-search refinement after BnB (tests / speed). */
  skipLocalSearch?: boolean;
  /** Owned items count as 0 gp. */
  ownedItems?: string[];
  /** Never equip these items. */
  excludeItems?: string[];
  /** On-task: enable slayer helm when worn. */
  onTask?: boolean;
}

/** Apply owned/exclude filters once at the start of an optimize run. */
function normalizeOptimizeOpts(opts: BudgetOptimizeOptions): BudgetOptimizeOptions {
  return {
    ...opts,
    equipment: filterExcludedEquipment(opts.equipment, opts.excludeItems),
    priceOf: withOwnedPrices(opts.priceOf, opts.ownedItems),
  };
}

type SlotCand = { item: WikiEquipment; cost: number; offense: number };
type SearchSlot = EquipmentSlot | "2h" | "weapon";

/**
 * Drop Pareto-dominated candidates: same-or-worse offense at higher cost,
 * or strictly worse offense at same-or-higher cost. Keeps the frontier for BnB.
 */
export function paretoFilterCandidates(
  cands: SlotCand[],
  limit = 16
): SlotCand[] {
  // Prefer higher offense, then lower cost
  const sorted = [...cands].sort((a, b) => b.offense - a.offense || a.cost - b.cost);
  const front: SlotCand[] = [];
  let bestCostForOffense = Number.POSITIVE_INFINITY;
  for (const c of sorted) {
    // Dominated if we already have ≥ offense at ≤ cost
    let dominated = false;
    for (const f of front) {
      if (f.offense >= c.offense && f.cost <= c.cost) {
        dominated = true;
        break;
      }
    }
    if (dominated) continue;
    // Also skip if worse offense but not cheaper enough (weak filter)
    if (c.cost >= bestCostForOffense && front.some((f) => f.offense > c.offense && f.cost <= c.cost))
      continue;
    front.push(c);
    if (c.cost < bestCostForOffense) bestCostForOffense = c.cost;
    if (front.length >= limit) break;
  }
  return front;
}

function gearFingerprint(gear: EquippedGear): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(gear)) {
    if (v) parts.push(`${k}:${v.name}`);
  }
  return parts.sort().join("|");
}

interface BeamState {
  gear: EquippedGear;
  remaining: number;
  dps: number;
}

/**
 * Greedy: pick best weapon under budget, then best item per armour slot
 * while cash remains. Returns a synthetic RankedLoadout.
 */
export function greedyOptimizeUnderBudget(raw: BudgetOptimizeOptions): RankedLoadout | null {
  const opts = normalizeOptimizeOpts(raw);
  const {
    equipment,
    priceOf,
    hiscores,
    target,
    budget,
    style,
    perSlot = 40,
    onTask = false,
  } = opts;

  const unlimited = !Number.isFinite(budget) || budget <= 0;
  let remaining = unlimited ? Number.POSITIVE_INFINITY : budget;
  const gear: EquippedGear = {};

  // ── Weapon first ────────────────────────────────────────────
  const weapons = equipment
    .filter((e) => (e.slot === "weapon" || e.slot === "2h") && styleOk(e, style))
    .filter((e) => {
      if (e.slot === "weapon" || e.slot === "2h") {
        const speed = e.attackSpeed || knownWeaponSpeed(e.name) || 0;
        return speed > 0 || style === "magic"; // magic often staff speed 4 default
      }
      return true;
    });

  let bestW: { item: WikiEquipment; dps: number; cost: number } | null = null;
  const emptyScore = scoreGear(style, {}, hiscores, target, onTask).dps;

  for (const w of weapons) {
    const cost = priceOrZero(priceOf, w.name);
    if (!unlimited && cost > remaining) continue;
    // Prefer priced weapons when budget set so untradeables don't always win
    if (!unlimited && cost === 0 && w.name.toLowerCase().includes("broken")) continue;
    const trial: EquippedGear =
      w.slot === "2h" ? { "2h": w } : { weapon: w };
    const { dps } = scoreGear(style, trial, hiscores, target, onTask);
    if (!bestW || dps > bestW.dps || (dps === bestW.dps && cost < bestW.cost)) {
      bestW = { item: w, dps, cost };
    }
  }

  if (bestW && bestW.dps >= emptyScore) {
    if (bestW.item.slot === "2h") gear["2h"] = bestW.item;
    else gear.weapon = bestW.item;
    if (!unlimited) remaining -= bestW.cost;
  }

  // ── Armour / jewellery slots ────────────────────────────────
  for (const slot of ARMOUR_SLOTS) {
    if (slot === "shield" && gear["2h"]) continue;
    if (slot === "ammo" && style === "melee") continue;

    const current = gear[slot] ?? null;
    const base = scoreGear(style, gear, hiscores, target, onTask).dps;

    const candidates = equipment
      .filter((e) => e.slot === slot && styleOk(e, style))
      .map((item) => {
        const cost = priceOrZero(priceOf, item.name);
        return { item, cost };
      })
      .filter(({ cost }) => unlimited || cost <= remaining)
      .sort((a, b) => offensiveScore(b.item, style) - offensiveScore(a.item, style))
      .slice(0, perSlot);

    let best: { item: WikiEquipment; dps: number; cost: number } | null = null;
    for (const { item, cost } of candidates) {
      if (current && item.name === current.name) continue;
      const trial = { ...gear, [slot]: item } as EquippedGear;
      if (slot === "weapon") delete trial["2h"];
      const { dps } = scoreGear(style, trial, hiscores, target, onTask);
      if (dps <= base + 0.005) continue;
      if (!best || dps > best.dps || (Math.abs(dps - best.dps) < 0.01 && cost < best.cost)) {
        best = { item, dps, cost };
      }
    }
    if (best) {
      gear[slot] = best.item;
      if (!unlimited) remaining -= best.cost;
    }
  }

  return toRanked(
    style,
    gear,
    hiscores,
    target,
    priceOf,
    budget,
    unlimited,
    "Greedy under-budget fill (weapon → armour)",
    onTask
  );
}

/**
 * Beam search under budget.
 *
 * Seeds several top weapons (not just #1), then for each slot-order variant
 * expands a beam of partial loadouts. Keeps the best final gear. Catches
 * "cheap weapon + better armour" tradeoffs that pure greedy misses.
 */
export function beamOptimizeUnderBudget(raw: BudgetOptimizeOptions): RankedLoadout | null {
  const opts = normalizeOptimizeOpts(raw);
  const {
    equipment,
    priceOf,
    hiscores,
    target,
    budget,
    style,
    perSlot = 24,
    beamWidth = 6,
    weaponSeeds = 5,
    onTask = false,
  } = opts;

  const unlimited = !Number.isFinite(budget) || budget <= 0;
  const cashCap = unlimited ? Number.POSITIVE_INFINITY : budget;

  const weapons = equipment
    .filter((e) => (e.slot === "weapon" || e.slot === "2h") && styleOk(e, style))
    .filter((e) => {
      const speed = e.attackSpeed || knownWeaponSpeed(e.name) || 0;
      return speed > 0 || style === "magic";
    })
    .map((w) => {
      const cost = priceOrZero(priceOf, w.name);
      return { w, cost };
    })
    .filter(({ w, cost }) => {
      if (!unlimited && cost > cashCap) return false;
      if (!unlimited && cost === 0 && w.name.toLowerCase().includes("broken")) return false;
      return true;
    });

  // Score weapons alone; keep top seeds by DPS (prefer cheaper when close).
  const weaponRanked = weapons
    .map(({ w, cost }) => {
      const trial: EquippedGear = w.slot === "2h" ? { "2h": w } : { weapon: w };
      const { dps } = scoreGear(style, trial, hiscores, target, onTask);
      return { w, cost, dps, trial };
    })
    .sort((a, b) => b.dps - a.dps || a.cost - b.cost)
    .slice(0, Math.max(1, weaponSeeds));

  if (weaponRanked.length === 0) {
    // Fall back to greedy (may still fill armour-only in edge cases)
    return greedyOptimizeUnderBudget(raw);
  }

  // Pre-index candidates per slot for style
  const bySlot = new Map<string, { item: WikiEquipment; cost: number }[]>();
  for (const slot of ARMOUR_SLOTS) {
    const list = equipment
      .filter((e) => e.slot === slot && styleOk(e, style))
      .map((item) => ({ item, cost: priceOrZero(priceOf, item.name) }))
      .sort((a, b) => offensiveScore(b.item, style) - offensiveScore(a.item, style))
      .slice(0, perSlot);
    bySlot.set(slot, list);
  }

  let bestGear: EquippedGear | null = null;
  let bestDps = -1;
  let bestCost = Number.POSITIVE_INFINITY;

  const consider = (gear: EquippedGear) => {
    const { dps } = scoreGear(style, gear, hiscores, target, onTask);
    const cost = setupCost(gear, priceOf);
    if (dps > bestDps + 0.001 || (Math.abs(dps - bestDps) < 0.001 && cost < bestCost)) {
      bestDps = dps;
      bestCost = cost;
      bestGear = { ...gear };
    }
  };

  for (const seed of weaponRanked) {
    for (const order of SLOT_ORDERS) {
      let beam: BeamState[] = [
        {
          gear: { ...seed.trial },
          remaining: unlimited ? Number.POSITIVE_INFINITY : cashCap - seed.cost,
          dps: seed.dps,
        },
      ];

      for (const slot of order) {
        const next: BeamState[] = [];
        for (const state of beam) {
          // Always keep "skip this slot" so we can spend later
          next.push(state);

          if (slot === "shield" && state.gear["2h"]) continue;
          if (slot === "ammo" && style === "melee") continue;

          const candidates = bySlot.get(slot) ?? [];
          for (const { item, cost } of candidates) {
            if (!unlimited && cost > state.remaining) continue;
            if (state.gear[slot]?.name === item.name) continue;
            const trial = { ...state.gear, [slot]: item } as EquippedGear;
            const { dps } = scoreGear(style, trial, hiscores, target, onTask);
            // Only expand if not worse than parent (small epsilon for noise)
            if (dps + 0.002 < state.dps) continue;
            next.push({
              gear: trial,
              remaining: unlimited ? Number.POSITIVE_INFINITY : state.remaining - cost,
              dps,
            });
          }
        }
        // Prune beam: keep highest DPS, then more remaining cash as tiebreak
        next.sort((a, b) => b.dps - a.dps || b.remaining - a.remaining);
        beam = next.slice(0, beamWidth);
      }

      for (const state of beam) {
        consider(state.gear);
      }
    }
  }

  // Also compare pure greedy (cheap insurance)
  const greedy = greedyOptimizeUnderBudget(raw);
  if (greedy) consider(greedy.gear);

  if (!bestGear) return greedy;

  return toRanked(
    style,
    bestGear,
    hiscores,
    target,
    priceOf,
    budget,
    unlimited,
    "Beam search under budget (multi-weapon + slot orders)",
    onTask
  );
}

/**
 * GearScape-class combinatorial BiS under budget.
 *
 * 1. Pareto-prune candidates per slot (offense vs cost)
 * 2. Value-rank weapon seeds (pure DPS + DPS/log-gp)
 * 3. Bounded-branch DFS (evaluate all affordable items at a slot, recurse
 *    into skip + top-K improvers only) — polynomial, not 14^10
 * 4. Extra wide beam + alternate slot orders as lower bound
 * 5. Local search: multi-pass 1-swap + limited 2-swap on high-impact slots
 */
export function combinatorialOptimizeUnderBudget(
  raw: BudgetOptimizeOptions
): RankedLoadout | null {
  const opts = normalizeOptimizeOpts(raw);
  const {
    equipment,
    priceOf,
    hiscores,
    target,
    budget,
    style,
    perSlot = 14,
    weaponSeeds = 12,
    maxEvals = 50_000,
    skipLocalSearch = false,
    onTask = false,
  } = opts;

  const unlimited = !Number.isFinite(budget) || budget <= 0;
  const cashCap = unlimited ? Number.POSITIVE_INFINITY : budget;
  /** At each DFS node: skip + this many best improvers. */
  const branchFactor = 4;

  // ── Candidate pools ─────────────────────────────────────────
  const rawWeapons = equipment
    .filter((e) => (e.slot === "weapon" || e.slot === "2h") && styleOk(e, style))
    .filter((e) => {
      const speed = e.attackSpeed || knownWeaponSpeed(e.name) || 0;
      return speed > 0 || style === "magic";
    })
    .map((w) => {
      const cost = priceOrZero(priceOf, w.name);
      return { item: w, cost, offense: offensiveScore(w, style) };
    })
    .filter(({ item, cost }) => {
      if (!unlimited && cost > cashCap) return false;
      if (!unlimited && cost === 0 && item.name.toLowerCase().includes("broken")) return false;
      return true;
    });

  const weaponCands = paretoFilterCandidates(rawWeapons, Math.max(weaponSeeds * 2, 20));

  const scoredWeapons = weaponCands
    .map((c) => {
      const trial: EquippedGear =
        c.item.slot === "2h" ? { "2h": c.item } : { weapon: c.item };
      const { dps } = scoreGear(style, trial, hiscores, target, onTask);
      const value = dps / Math.log10(Math.max(10, c.cost) + 10);
      return { ...c, dps, trial, value };
    })
    .sort((a, b) => b.dps - a.dps || a.cost - b.cost);

  const seedSet = new Map<string, (typeof scoredWeapons)[0]>();
  for (const w of scoredWeapons.slice(0, weaponSeeds)) seedSet.set(w.item.name, w);
  const byValue = [...scoredWeapons].sort((a, b) => b.value - a.value || b.dps - a.dps);
  for (const w of byValue) {
    if (seedSet.size >= weaponSeeds + Math.ceil(weaponSeeds / 2)) break;
    seedSet.set(w.item.name, w);
  }
  const seeds = [...seedSet.values()];

  if (seeds.length === 0) {
    return greedyOptimizeUnderBudget(raw);
  }

  const armourOrders: (EquipmentSlot | "2h")[][] = [
    ["neck", "body", "legs", "head", "feet", "hands", "ring", "cape", "shield", "ammo"],
    ["body", "legs", "neck", "head", "ring", "feet", "hands", "cape", "shield", "ammo"],
    ["ring", "neck", "cape", "hands", "feet", "head", "legs", "body", "shield", "ammo"],
  ];

  const bySlot = new Map<string, SlotCand[]>();
  for (const slot of ARMOUR_SLOTS) {
    if (slot === "ammo" && style === "melee") {
      bySlot.set(slot, []);
      continue;
    }
    const raw = equipment
      .filter((e) => e.slot === slot && styleOk(e, style))
      .map((item) => ({
        item,
        cost: priceOrZero(priceOf, item.name),
        offense: offensiveScore(item, style),
      }))
      .filter((c) => unlimited || c.cost <= cashCap);
    bySlot.set(slot, paretoFilterCandidates(raw, perSlot));
  }

  let bestGear: EquippedGear | null = null;
  let bestDps = -1;
  let bestCost = Number.POSITIVE_INFINITY;
  let evals = 0;

  const scoreCached = new Map<string, number>();
  const score = (gear: EquippedGear): number => {
    const key = gearFingerprint(gear);
    const hit = scoreCached.get(key);
    if (hit != null) return hit;
    evals += 1;
    const { dps } = scoreGear(style, gear, hiscores, target, onTask);
    scoreCached.set(key, dps);
    return dps;
  };

  const consider = (gear: EquippedGear, dps?: number) => {
    const d = dps ?? score(gear);
    const cost = setupCost(gear, priceOf);
    if (d > bestDps + 0.0005 || (Math.abs(d - bestDps) < 0.0005 && cost < bestCost)) {
      bestDps = d;
      bestCost = cost;
      bestGear = { ...gear };
    }
  };

  // ── Bounded-branch DFS per weapon × slot order ──────────────
  for (const seed of seeds) {
    if (evals >= maxEvals) break;
    const startCash = unlimited ? Number.POSITIVE_INFINITY : cashCap - seed.cost;
    if (startCash < 0) continue;

    for (const armourOrder of armourOrders) {
      if (evals >= maxEvals) break;

      const startGear: EquippedGear = { ...seed.trial };
      const startDps = score(startGear);
      consider(startGear, startDps);

      const dfs = (
        slotIdx: number,
        gear: EquippedGear,
        remaining: number,
        currentDps: number
      ): void => {
        if (evals >= maxEvals) return;
        if (slotIdx >= armourOrder.length) {
          consider(gear, currentDps);
          return;
        }

        const slot = armourOrder[slotIdx]!;

        // Soft prune: hopeless if far behind and late in the tree
        if (slotIdx >= 4 && currentDps + 0.5 < bestDps * 0.92) {
          return;
        }

        type Branch = { gear: EquippedGear; remaining: number; dps: number };
        const branches: Branch[] = [
          { gear, remaining, dps: currentDps }, // skip
        ];

        if (!(slot === "shield" && gear["2h"]) && !(slot === "ammo" && style === "melee")) {
          for (const { item, cost } of bySlot.get(slot) ?? []) {
            if (evals >= maxEvals) break;
            if (!unlimited && cost > remaining) continue;
            if (gear[slot]?.name === item.name) continue;
            const trial = { ...gear, [slot]: item } as EquippedGear;
            const dps = score(trial);
            if (dps + 0.02 < currentDps) continue; // clear regression
            branches.push({
              gear: trial,
              remaining: unlimited ? Number.POSITIVE_INFINITY : remaining - cost,
              dps,
            });
          }
        }

        branches.sort((a, b) => b.dps - a.dps || b.remaining - a.remaining);
        // Always keep skip (index may have moved); take top branchFactor unique
        const chosen: Branch[] = [];
        const seen = new Set<string>();
        for (const b of branches) {
          const fp = gearFingerprint(b.gear) + `@${slotIdx}`;
          if (seen.has(fp)) continue;
          seen.add(fp);
          chosen.push(b);
          if (chosen.length >= branchFactor) break;
        }
        // Ensure skip is always explored when budget is tight
        if (!chosen.some((c) => c.gear === gear || gearFingerprint(c.gear) === gearFingerprint(gear))) {
          chosen.push({ gear, remaining, dps: currentDps });
        }

        for (const b of chosen) {
          dfs(slotIdx + 1, b.gear, b.remaining, b.dps);
        }
      };

      dfs(0, startGear, startCash, startDps);
    }
  }

  // ── Local search refinement ─────────────────────────────────
  if (bestGear && !skipLocalSearch) {
    bestGear = localSearchRefine({
      gear: bestGear,
      style,
      bySlot,
      weaponCands: scoredWeapons.map((w) => ({
        item: w.item,
        cost: w.cost,
        offense: w.offense,
      })),
      priceOf,
      cashCap,
      unlimited,
      hiscores,
      target,
      score,
      maxEvals: () => Math.max(0, maxEvals - evals),
      onEval: () => {
        /* evals counted inside score() */
      },
    });
    consider(bestGear);
  }

  // Insurance: existing beam may still win on odd edges
  const beam = beamOptimizeUnderBudget({
    ...raw,
    weaponSeeds: Math.min(weaponSeeds, 8),
    beamWidth: 10,
    perSlot: Math.min(perSlot + 6, 24),
  });
  if (beam) consider(beam.gear);

  if (!bestGear) {
    return greedyOptimizeUnderBudget(raw);
  }

  return toRanked(
    style,
    bestGear,
    hiscores,
    target,
    priceOf,
    budget,
    unlimited,
    "Combinatorial BiS (Pareto + bounded BnB + local search)",
    onTask
  );
}

function localSearchRefine(args: {
  gear: EquippedGear;
  style: CombatStyle;
  bySlot: Map<string, SlotCand[]>;
  weaponCands: SlotCand[];
  priceOf: (n: string) => number | null;
  cashCap: number;
  unlimited: boolean;
  hiscores: HiscoreData | null;
  target: LoadoutTarget;
  score: (g: EquippedGear) => number;
  maxEvals: () => number;
  onEval: () => void;
}): EquippedGear {
  let gear = { ...args.gear };
  let bestDps = args.score(gear);
  let improved = true;
  let passes = 0;

  const slots: SearchSlot[] = [
    "weapon",
    "2h",
    "neck",
    "body",
    "legs",
    "head",
    "feet",
    "hands",
    "ring",
    "cape",
    "shield",
    "ammo",
  ];

  while (improved && passes < 4 && args.maxEvals() > 100) {
    improved = false;
    passes += 1;
    const spent = setupCost(gear, args.priceOf);
    const remaining = args.unlimited
      ? Number.POSITIVE_INFINITY
      : args.cashCap - spent;

    // ── 1-swap: every slot ────────────────────────────────────
    for (const slot of slots) {
      if (slot === "ammo" && args.style === "melee") continue;
      if (slot === "shield" && gear["2h"]) continue;
      if ((slot === "weapon" || slot === "2h") && gear["2h"] && slot === "weapon") continue;

      const current = gear[slot as keyof EquippedGear] as WikiEquipment | undefined;
      const currentCost = current ? priceOrZero(args.priceOf, current.name) : 0;
      const pool =
        slot === "weapon" || slot === "2h"
          ? args.weaponCands.filter((c) =>
              slot === "2h" ? c.item.slot === "2h" : c.item.slot === "weapon"
            )
          : (args.bySlot.get(slot) ?? []);

      for (const { item, cost } of pool) {
        if (args.maxEvals() <= 0) return gear;
        if (current && item.name === current.name) continue;
        const delta = cost - currentCost;
        if (!args.unlimited && delta > remaining + 0.5) continue;

        const trial = { ...gear } as EquippedGear;
        if (slot === "weapon") {
          delete trial["2h"];
          trial.weapon = item;
        } else if (slot === "2h") {
          delete trial.weapon;
          delete trial.shield;
          trial["2h"] = item;
        } else {
          trial[slot] = item;
        }
        const dps = args.score(trial);
        if (dps > bestDps + 0.001) {
          bestDps = dps;
          gear = trial;
          improved = true;
        }
      }

      // Try empty slot (free cash for other swaps later)
      if (current && slot !== "weapon" && slot !== "2h") {
        const trial = { ...gear };
        delete trial[slot];
        const dps = args.score(trial);
        // Only empty if somehow better (rare) — usually we keep for 2-swap cash
        if (dps > bestDps + 0.001) {
          bestDps = dps;
          gear = trial;
          improved = true;
        }
      }
    }

    // ── Limited 2-swap on high-impact pairs ───────────────────
    if (args.maxEvals() < 200) break;
    const pairSlots: (EquipmentSlot | "weapon")[] = ["weapon", "neck", "body", "legs", "head"];
    for (let i = 0; i < pairSlots.length && args.maxEvals() > 50; i++) {
      for (let j = i + 1; j < pairSlots.length && args.maxEvals() > 50; j++) {
        const s1 = pairSlots[i]!;
        const s2 = pairSlots[j]!;
        const pool1 =
          s1 === "weapon"
            ? args.weaponCands.filter((c) => c.item.slot === "weapon" || c.item.slot === "2h")
            : (args.bySlot.get(s1) ?? []);
        const pool2 = args.bySlot.get(s2) ?? [];
        // Cap combinations
        const p1 = pool1.slice(0, 8);
        const p2 = pool2.slice(0, 8);
        const c1 = gear[s1 === "weapon" ? (gear["2h"] ? "2h" : "weapon") : s1] as
          | WikiEquipment
          | undefined;
        const c2 = gear[s2] as WikiEquipment | undefined;
        const baseCost =
          (c1 ? priceOrZero(args.priceOf, c1.name) : 0) +
          (c2 ? priceOrZero(args.priceOf, c2.name) : 0);
        const freeCash = args.unlimited
          ? Number.POSITIVE_INFINITY
          : args.cashCap - setupCost(gear, args.priceOf) + baseCost;

        for (const a of p1) {
          for (const b of p2) {
            if (args.maxEvals() <= 0) return gear;
            if (a.cost + b.cost > freeCash) continue;
            const trial = { ...gear } as EquippedGear;
            if (a.item.slot === "2h") {
              delete trial.weapon;
              delete trial.shield;
              trial["2h"] = a.item;
            } else if (s1 === "weapon") {
              delete trial["2h"];
              trial.weapon = a.item;
            } else {
              trial[s1] = a.item;
            }
            trial[s2] = b.item;
            const dps = args.score(trial);
            if (dps > bestDps + 0.001) {
              bestDps = dps;
              gear = trial;
              improved = true;
            }
          }
        }
      }
    }
  }

  return gear;
}

/** Prefer combinatorial BiS; falls back through beam → greedy. */
export function optimizeUnderBudget(opts: BudgetOptimizeOptions): RankedLoadout | null {
  return (
    combinatorialOptimizeUnderBudget(opts) ??
    beamOptimizeUnderBudget(opts) ??
    greedyOptimizeUnderBudget(opts)
  );
}

/** Run optimizer for each style and return non-null results. */
export function greedyOptimizeAllStyles(
  opts: Omit<BudgetOptimizeOptions, "style"> & { styles?: CombatStyle[] }
): RankedLoadout[] {
  return optimizeAllStyles(opts);
}

/** Run full combinatorial optimizer for each style (preferred UI entry). */
export function optimizeAllStyles(
  opts: Omit<BudgetOptimizeOptions, "style"> & { styles?: CombatStyle[] }
): RankedLoadout[] {
  const styles = opts.styles?.length ? opts.styles : (["melee", "ranged", "magic"] as CombatStyle[]);
  const out: RankedLoadout[] = [];
  for (const style of styles) {
    const r = optimizeUnderBudget({ ...opts, style });
    if (r && r.dps > 0) out.push(r);
  }
  out.sort((a, b) => b.dps - a.dps);
  return out;
}
