import { getCached, setCache } from "./cache";
import { apiFetch } from "./fetch";
import { isTauri } from "../env";

const STARS_API = isTauri
  ? "https://public.starminers.site/crowdsource"
  : "/api/stars/crowdsource";

const STARS_TTL = 30 * 1000; // 30 seconds - stars change frequently
const API_KEY = "1E15qy2D4M4G";

export interface LiveStar {
  world: number;
  location: number;
  calledBy: string;
  calledLocation: string;
  calledAt: number;
  minTime: number | null;
  tier: number;
  maxTime: number | null;
}

export async function fetchLiveStars(): Promise<LiveStar[]> {
  const cacheKey = "live-stars";
  const cached = getCached<LiveStar[]>(cacheKey, STARS_TTL);
  if (cached) return cached;

  try {
    const res = await apiFetch(STARS_API, {
      headers: {
        Authorization: API_KEY,
        "User-Agent": "RuneWise OSRS Companion",
      },
    });
    if (!res.ok) return [];
    const data: LiveStar[] = await res.json();
    setCache(cacheKey, data);
    return data;
  } catch {
    return [];
  }
}
