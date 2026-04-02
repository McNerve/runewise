import { fetchJson } from "./client";
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
