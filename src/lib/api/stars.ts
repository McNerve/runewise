import { getCached, setCache } from "./cache";
import { apiFetch } from "./fetch";
import { isTauri } from "../env";

const STARS_API = isTauri
  ? "https://public.starminers.site/crowdsource"
  : "/api/stars/crowdsource";
const STARS_FALLBACK_PAGE = "https://07.gg/trackers/shooting-star";

const STARS_TTL = 30 * 1000; // 30 seconds - stars change frequently
const API_KEY = "1E15qy2D4M4G";

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

interface FallbackStarCall {
  calledAt: number;
  caller: string;
  world: number;
  tier: number;
  locationKey: string;
  rawLocation: string;
  estimatedEnd: number;
}

const LOCATION_KEY_LABELS: Partial<Record<string, string>> = {
  DESERT_QUARRY: "Desert quarry",
  NORTH_BRIMHAVEN_MINE: "North Brimhaven mine",
  SOUTH_BRIMHAVEN_MINE: "South Brimhaven mine",
  MINING_GUILD_ENTRANCE: "West Falador mine",
  KARAMJA_JUNGLE_MINE__NATURE_ALTAR: "Karamja Jungle mine (Nature Altar)",
  AL_KHARID_MINE: "Al Kharid mine",
  AL_KHARID_BANK: "Al Kharid (bank)",
  STONECUTTER_OUTPOST: "Stonecutter Outpost (Varlamore South East mine)",
};

function normalizeFallbackLocation(call: FallbackStarCall): string {
  const canonical = LOCATION_KEY_LABELS[call.locationKey];
  if (canonical) return canonical;

  const raw = call.rawLocation.trim();
  const lower = raw.toLowerCase();

  if (lower.includes("sandstorm") || lower.includes("sand mine")) {
    return "Desert quarry";
  }

  if (lower.includes("southwest of brimhaven")) {
    return "South Brimhaven mine";
  }

  if (lower.includes("brimhaven northwest")) {
    return "North Brimhaven mine";
  }

  if (lower.includes("east falador")) {
    return "West Falador mine";
  }

  return raw;
}

function parse07GgStars(html: string): LiveStar[] {
  const marker = '\\"initialCalls\\":';
  const plainMarker = '"initialCalls":';
  const markerIndex = html.indexOf(marker);
  const plainMarkerIndex = html.indexOf(plainMarker);
  const startIndex = markerIndex !== -1 ? markerIndex : plainMarkerIndex;
  if (startIndex === -1) return [];

  const start = html.indexOf("[", startIndex);
  if (start === -1) return [];

  let depth = 0;
  let end = -1;
  for (let index = start; index < html.length; index += 1) {
    const char = html[index];
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        end = index;
        break;
      }
    }
  }
  if (end === -1) return [];

  try {
    const json = html.slice(start, end + 1).replace(/\\"/g, "\"");
    const calls = JSON.parse(json) as FallbackStarCall[];
    return calls.map((call) => ({
      world: call.world,
      location: 0,
      calledBy: call.caller,
      calledLocation: normalizeFallbackLocation(call),
      locationKey: typeof call.locationKey === "string" ? call.locationKey : null,
      calledAt: Math.floor(call.calledAt / 1000),
      minTime: null,
      tier: call.tier,
      maxTime: Math.floor(call.estimatedEnd / 1000),
    }));
  } catch {
    return [];
  }
}

async function fetchFallbackStars(): Promise<LiveStar[]> {
  try {
    const res = await apiFetch(STARS_FALLBACK_PAGE, {
      headers: {
        "User-Agent": "RuneWise OSRS Companion",
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    return parse07GgStars(html);
  } catch {
    return [];
  }
}

export async function fetchLiveStars(): Promise<LiveStar[]> {
  const cacheKey = "live-stars:v2";
  const cached = getCached<LiveStar[]>(cacheKey, STARS_TTL);
  if (cached) return cached;

  try {
    const res = await apiFetch(STARS_API, {
      headers: {
        Authorization: API_KEY,
        "User-Agent": "RuneWise OSRS Companion",
      },
    });
    if (!res.ok) {
      const fallback = await fetchFallbackStars();
      setCache(cacheKey, fallback);
      return fallback;
    }

    const data: LiveStar[] = await res.json();
    if (data.length === 0) {
      const fallback = await fetchFallbackStars();
      setCache(cacheKey, fallback);
      return fallback;
    }

    setCache(cacheKey, data);
    return data;
  } catch {
    const fallback = await fetchFallbackStars();
    setCache(cacheKey, fallback);
    return fallback;
  }
}
