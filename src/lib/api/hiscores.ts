import { getCached, setCache } from "./cache";
import { apiFetch } from "./fetch";

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

const isTauri = "__TAURI_INTERNALS__" in window;
const BASE_URL = isTauri
  ? "https://secure.runescape.com/m=hiscore_oldschool"
  : "/api/hiscores";

const HISCORES_TTL = 10 * 60 * 1000;

export async function fetchHiscores(rsn: string): Promise<HiscoreData> {
  const cacheKey = `hiscores:${rsn.toLowerCase()}`;
  const cached = getCached<HiscoreData>(cacheKey, HISCORES_TTL);
  if (cached) return cached;

  const res = await apiFetch(
    `${BASE_URL}/index_lite.json?player=${encodeURIComponent(rsn)}`
  );
  if (!res.ok) {
    if (res.status === 404) throw new Error(`Player "${rsn}" not found`);
    throw new Error(`Hiscores API error: ${res.status}`);
  }
  const data: HiscoreData = await res.json();
  setCache(cacheKey, data);
  return data;
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
