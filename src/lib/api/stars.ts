import { getCached, setCache } from "./cache";
import { apiFetch } from "./fetch";
import { isTauri } from "../env";

const STARS_API = isTauri
  ? "https://old.07.gg/shooting-stars/api/calls"
  : "/api/stars/shooting-stars/api/calls";

const STARS_TTL = 30 * 1000; // 30 seconds

export interface LiveStar {
  world: number;
  location: number;
  calledBy: string;
  calledLocation: string;
  locationKey?: string | null;
  calledAt: number;
  minTime: number | null;
  tier: number;
  maxTime: number | null;
}

interface RawStar07gg {
  world: number;
  tier: number;
  caller: string;
  rawLocation: string;
  locationKey: string | Record<string, never>;
  calledAt: number;
  estimatedEnd: number;
}

function toliveStar(raw: RawStar07gg): LiveStar {
  return {
    world: raw.world,
    tier: raw.tier,
    calledBy: raw.caller,
    calledLocation: raw.rawLocation,
    locationKey: typeof raw.locationKey === "string" ? raw.locationKey : null,
    calledAt: Math.floor(raw.calledAt / 1000),
    location: 0,
    minTime: null,
    maxTime: Math.floor(raw.estimatedEnd / 1000),
  };
}

export async function fetchLiveStars(): Promise<LiveStar[]> {
  const cacheKey = "live-stars:v3";
  const cached = getCached<LiveStar[]>(cacheKey, STARS_TTL);
  if (cached) return cached;

  try {
    const res = await apiFetch(STARS_API);
    if (!res.ok) return [];

    const raw: RawStar07gg[] = await res.json();
    const data = raw.map(toliveStar);
    setCache(cacheKey, data);
    return data;
  } catch {
    return [];
  }
}
