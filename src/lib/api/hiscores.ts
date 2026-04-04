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
  // Only run in Tauri — dev mode proxy 404s are noisy and non-functional
  if (!isTauri) return "none";
  for (const type of ["hardcore", "ultimate", "ironman"] as const) {
    try {
      const url = `${IRONMAN_URLS[type]}/index_lite.json?player=${encodeURIComponent(rsn)}`;
      const res = await apiFetch(url);
      if (res.ok) return type;
    } catch {
      // Not on this hiscore = not this type
    }
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
