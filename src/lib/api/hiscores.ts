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

export function getSkillLevel(data: HiscoreData, skillName: string): number {
  const skill = data.skills.find(
    (s) => s.name.toLowerCase() === skillName.toLowerCase()
  );
  return skill?.level ?? 1;
}

export function getSkillXp(data: HiscoreData, skillName: string): number {
  const skill = data.skills.find(
    (s) => s.name.toLowerCase() === skillName.toLowerCase()
  );
  return skill?.xp ?? 0;
}

/** Fuzzy-match a boss/activity source against the hiscores activities list.
 *  Prefers exact match, then substring (both directions) with a 4-char floor on the shorter side
 *  to avoid false positives on short names like "Nex" matching "Nexus". */
export function findActivityScore(data: HiscoreData, source: string): number | null {
  if (!data.activities) return null;
  const src = source.toLowerCase();
  const exact = data.activities.find((a) => a.name.toLowerCase() === src);
  if (exact) return exact.score > 0 ? exact.score : null;
  const fuzzy = data.activities.find((a) => {
    const name = a.name.toLowerCase();
    const shorter = Math.min(name.length, src.length);
    return shorter >= 4 && (name.includes(src) || src.includes(name));
  });
  return fuzzy && fuzzy.score > 0 ? fuzzy.score : null;
}
