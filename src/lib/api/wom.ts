import { fetchJson } from "./client";
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
  ehp: number;
  ehb: number;
  ttm: number;
  tt200m: number;
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
  return fetchJson<WomPlayer>({
    url: `${WOM_API}/players/${encodeURIComponent(rsn)}`,
    cacheKey: `wom-player:${rsn.toLowerCase()}`,
    ttlMs: PLAYER_TTL,
    persist: true,
  });
}

export type GainsPeriod = "day" | "week" | "month" | "year";

export async function fetchWomGains(
  rsn: string,
  period: GainsPeriod = "week"
): Promise<WomGains> {
  return fetchJson<WomGains>({
    url: `${WOM_API}/players/${encodeURIComponent(rsn)}/gained?period=${period}`,
    cacheKey: `wom-gains:${rsn.toLowerCase()}:${period}`,
    ttlMs: GAINS_TTL,
    transform: (json) =>
      typeof json === "object" && json !== null && "data" in json
        ? (json as { data: WomGains }).data
        : { skills: {}, bosses: {} },
  });
}

export async function fetchWomAchievements(
  rsn: string
): Promise<WomAchievement[]> {
  return fetchJson<WomAchievement[]>({
    url: `${WOM_API}/players/${encodeURIComponent(rsn)}/achievements`,
    cacheKey: `wom-achievements:${rsn.toLowerCase()}`,
    ttlMs: ACHIEVEMENTS_TTL,
  });
}

export async function fetchWomRecords(
  rsn: string
): Promise<WomRecord[]> {
  return fetchJson<WomRecord[]>({
    url: `${WOM_API}/players/${encodeURIComponent(rsn)}/records`,
    cacheKey: `wom-records:${rsn.toLowerCase()}`,
    ttlMs: ACHIEVEMENTS_TTL,
  });
}

export interface WomNameChange {
  oldName: string;
  newName: string;
  resolvedAt: string | null;
  status: string;
}

export async function fetchWomNameChanges(
  rsn: string
): Promise<WomNameChange[]> {
  try {
    return await fetchJson<WomNameChange[]>({
      url: `${WOM_API}/players/${encodeURIComponent(rsn)}/names`,
      cacheKey: `wom-names:${rsn.toLowerCase()}`,
      ttlMs: ACHIEVEMENTS_TTL,
      transform: (json) => (Array.isArray(json) ? (json as WomNameChange[]) : []),
    });
  } catch {
    return [];
  }
}
