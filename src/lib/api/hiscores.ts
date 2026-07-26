import { fetchJson } from "./client";
import { apiFetch } from "./fetch";
import { isTauri } from "../env";
import { parseHiscoreData } from "./validators";

export interface HiscoreSkill {
  id: number;
  name: string;
  rank: number;
  level: number;
  xp: number;
}

export interface HiscoreData {
  skills: HiscoreSkill[];
  activities: { id: number; name: string; rank: number; score: number }[];
}

const BASE_URL = isTauri
  ? "https://secure.runescape.com/m=hiscore_oldschool"
  : "/api/hiscores";

const HISCORES_TTL = 10 * 60 * 1000;

export async function fetchHiscores(rsn: string): Promise<HiscoreData> {
  try {
    return await fetchJson<HiscoreData>({
      url: `${BASE_URL}/index_lite.json?player=${encodeURIComponent(rsn)}`,
      cacheKey: `hiscores:${rsn.toLowerCase()}`,
      ttlMs: HISCORES_TTL,
      persist: true,
      parser: parseHiscoreData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("404")) {
      throw new Error(`Player "${rsn}" not found`);
    }
    throw error;
  }
}

export type IronmanType = "none" | "ironman" | "hardcore" | "ultimate";

const IRONMAN_URLS: Record<Exclude<IronmanType, "none">, string> = {
  ironman: isTauri
    ? "https://secure.runescape.com/m=hiscore_oldschool_ironman"
    : "/api/hiscores-ironman",
  hardcore: isTauri
    ? "https://secure.runescape.com/m=hiscore_oldschool_hardcore_ironman"
    : "/api/hiscores-hardcore",
  ultimate: isTauri
    ? "https://secure.runescape.com/m=hiscore_oldschool_ultimate"
    : "/api/hiscores-ultimate",
};

export async function detectIronmanType(rsn: string): Promise<IronmanType> {
  const types = ["hardcore", "ultimate", "ironman"] as const;
  const results = await Promise.allSettled(
    types.map((type) =>
      apiFetch(`${IRONMAN_URLS[type]}/index_lite.json?player=${encodeURIComponent(rsn)}`)
        .then((res) => (res.ok ? type : null))
    )
  );

  // Return most specific match (hardcore > ultimate > ironman)
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) return result.value;
  }
  return "none";
}

/**
 * Canonical skill name keys + aliases used by Jagex / WOM / older payloads.
 * Lookup is case-insensitive exact match against any alias.
 */
const SKILL_ALIASES: Record<string, string[]> = {
  attack: ["attack"],
  strength: ["strength"],
  defence: ["defence", "defense"],
  ranged: ["ranged", "range"],
  prayer: ["prayer"],
  magic: ["magic"],
  runecraft: ["runecraft", "runecrafting"],
  hitpoints: ["hitpoints", "hit points", "hp", "constitution"],
  crafting: ["crafting"],
  mining: ["mining"],
  smithing: ["smithing"],
  fishing: ["fishing"],
  cooking: ["cooking"],
  firemaking: ["firemaking"],
  woodcutting: ["woodcutting"],
  agility: ["agility"],
  herblore: ["herblore"],
  thieving: ["thieving"],
  fletching: ["fletching"],
  slayer: ["slayer"],
  farming: ["farming"],
  construction: ["construction"],
  hunter: ["hunter"],
};

function skillNameKeys(skillName: string): string[] {
  const lower = skillName.toLowerCase().trim();
  const fromMap = SKILL_ALIASES[lower];
  if (fromMap) return fromMap;
  // Also accept any alias as input (e.g. "Range" → ranged keys)
  for (const keys of Object.values(SKILL_ALIASES)) {
    if (keys.includes(lower)) return keys;
  }
  return [lower];
}

function findSkill(data: HiscoreData, skillName: string): HiscoreSkill | undefined {
  const keys = skillNameKeys(skillName);
  for (const key of keys) {
    const hit = data.skills.find((s) => s.name.toLowerCase() === key);
    if (hit) return hit;
  }
  return undefined;
}

/**
 * Resolve a combat/skilling level from hiscores with alias support.
 * @param fallback used when data is null/empty or the skill is missing (default 1).
 */
export function getSkillLevel(
  data: HiscoreData | null | undefined,
  skillName: string,
  fallback = 1
): number {
  if (!data?.skills?.length) return fallback;
  const skill = findSkill(data, skillName);
  if (!skill) return fallback;
  return skill.level >= 1 ? skill.level : fallback;
}

export function getSkillXp(
  data: HiscoreData | null | undefined,
  skillName: string,
  fallback = 0
): number {
  if (!data?.skills?.length) return fallback;
  const skill = findSkill(data, skillName);
  return skill?.xp ?? fallback;
}

/** Fuzzy-match a boss/activity source against the hiscores activities list.
 *  Prefers exact match, then substring (both directions) with a 4-char floor on the shorter side
 *  to avoid false positives on short names like "Nex" matching "Nexus". */
export function findActivityScore(data: HiscoreData, source: string): number | null {
  if (!data.activities) return null;
  const src = source.toLowerCase();
  const exact = data.activities.find((a) => a.name.toLowerCase() === src);
  if (exact) return exact.score > 0 ? exact.score : null;
  // Substring match (both directions), but pick the CLOSEST-length candidate so
  // "The Gauntlet" doesn't resolve to "The Corrupted Gauntlet" (or vice-versa).
  const candidates = data.activities.filter((a) => {
    const name = a.name.toLowerCase();
    const shorter = Math.min(name.length, src.length);
    return shorter >= 4 && (name.includes(src) || src.includes(name));
  });
  candidates.sort(
    (a, b) => Math.abs(a.name.length - src.length) - Math.abs(b.name.length - src.length)
  );
  const fuzzy = candidates[0];
  return fuzzy && fuzzy.score > 0 ? fuzzy.score : null;
}
