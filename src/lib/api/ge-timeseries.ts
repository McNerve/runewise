import { apiFetch } from "./fetch";
import { getCached, setCache } from "./cache";
import { isTauri } from "../env";

const BASE = isTauri
  ? "https://prices.runescape.wiki/api/v1/osrs"
  : "/api/wiki-prices";

export interface TimeseriesPoint {
  timestamp: number;
  avgHighPrice: number | null;
  avgLowPrice: number | null;
  highPriceVolume: number;
  lowPriceVolume: number;
}

export type Timestep = "5m" | "1h" | "6h" | "24h";

const TTL: Record<Timestep, number> = {
  "5m": 5 * 60 * 1000,
  "1h": 5 * 60 * 1000,
  "6h": 30 * 60 * 1000,
  "24h": 30 * 60 * 1000,
};

export async function fetchTimeseries(
  itemId: number,
  timestep: Timestep
): Promise<TimeseriesPoint[]> {
  const cacheKey = `timeseries:${itemId}:${timestep}`;
  const cached = getCached<TimeseriesPoint[]>(cacheKey, TTL[timestep]);
  if (cached) return cached;

  const res = await apiFetch(
    `${BASE}/timeseries?timestep=${timestep}&id=${itemId}`
  );
  if (!res.ok) throw new Error(`Timeseries API error: ${res.status}`);
  const json = await res.json();
  const data: TimeseriesPoint[] = json.data ?? [];
  setCache(cacheKey, data);
  return data;
}
