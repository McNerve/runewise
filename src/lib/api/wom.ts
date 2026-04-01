import { getCached, setCache } from "./cache";
import { apiFetch } from "./fetch";
import { isTauri } from "../env";
const WOM_API = isTauri
  ? "https://api.wiseoldman.net/v2"
  : "/api/wom";

const PLAYER_TTL = 10 * 60 * 1000; // 10 minutes
const GAINS_TTL = 5 * 60 * 1000; // 5 minutes
const ACHIEVEMENTS_TTL = 30 * 60 * 1000; // 30 minutes

export interface WomPlayer {
  id: number;
  displayName: string;
  type: string;
  build: string;
  combatLevel: number;
  updatedAt: string;
  latestSnapshot: {
    data: {
      skills: Record<
        string,
        {
          metric: string;
          experience: number;
          rank: number;
          level: number;
        }
      >;
      bosses: Record<
        string,
        { metric: string; kills: number; rank: number }
      >;
    };
  };
}

export interface WomGains {
  skills: Record<
    string,
    {
      experience: { gained: number; start: number; end: number };
      rank: { gained: number; start: number; end: number };
    }
  >;
  bosses: Record<
    string,
    {
      kills: { gained: number; start: number; end: number };
      rank: { gained: number; start: number; end: number };
    }
  >;
}

export interface WomAchievement {
  name: string;
  metric: string;
  measure: string;
  threshold: number;
  createdAt: string;
}

export interface WomRecord {
  metric: string;
  period: string;
  value: number;
  updatedAt: string;
}

export async function fetchWomPlayer(rsn: string): Promise<WomPlayer> {
  const cacheKey = `wom-player:${rsn.toLowerCase()}`;
  const cached = getCached<WomPlayer>(cacheKey, PLAYER_TTL);
  if (cached) return cached;

  const res = await apiFetch(
    `${WOM_API}/players/${encodeURIComponent(rsn)}`
  );
  if (!res.ok) throw new Error(`WOM API error: ${res.status}`);
  const data: WomPlayer = await res.json();
  setCache(cacheKey, data);
  return data;
}

export type GainsPeriod = "day" | "week" | "month" | "year";

export async function fetchWomGains(
  rsn: string,
  period: GainsPeriod = "week"
): Promise<WomGains> {
  const cacheKey = `wom-gains:${rsn.toLowerCase()}:${period}`;
  const cached = getCached<WomGains>(cacheKey, GAINS_TTL);
  if (cached) return cached;

  const res = await apiFetch(
    `${WOM_API}/players/${encodeURIComponent(rsn)}/gained?period=${period}`
  );
  if (!res.ok) throw new Error(`WOM gains error: ${res.status}`);
  const json = await res.json();
  const data: WomGains = json.data;
  setCache(cacheKey, data);
  return data;
}

export async function fetchWomAchievements(
  rsn: string
): Promise<WomAchievement[]> {
  const cacheKey = `wom-achievements:${rsn.toLowerCase()}`;
  const cached = getCached<WomAchievement[]>(cacheKey, ACHIEVEMENTS_TTL);
  if (cached) return cached;

  const res = await apiFetch(
    `${WOM_API}/players/${encodeURIComponent(rsn)}/achievements`
  );
  if (!res.ok) throw new Error(`WOM achievements error: ${res.status}`);
  const data: WomAchievement[] = await res.json();
  setCache(cacheKey, data);
  return data;
}

export async function fetchWomRecords(
  rsn: string
): Promise<WomRecord[]> {
  const cacheKey = `wom-records:${rsn.toLowerCase()}`;
  const cached = getCached<WomRecord[]>(cacheKey, ACHIEVEMENTS_TTL);
  if (cached) return cached;

  const res = await apiFetch(
    `${WOM_API}/players/${encodeURIComponent(rsn)}/records`
  );
  if (!res.ok) throw new Error(`WOM records error: ${res.status}`);
  const data: WomRecord[] = await res.json();
  setCache(cacheKey, data);
  return data;
}
