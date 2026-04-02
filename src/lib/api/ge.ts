import { fetchJson } from "./client";
import { isTauri } from "../env";

export interface ItemMapping {
  id: number;
  name: string;
  examine: string;
  members: boolean;
  lowalch: number | null;
  highalch: number | null;
  limit: number | null;
  value: number;
  icon: string;
}

export interface ItemPrice {
  high: number | null;
  highTime: number | null;
  low: number | null;
  lowTime: number | null;
}

const WIKI_API = isTauri
  ? "https://prices.runescape.wiki/api/v1/osrs"
  : "/api/wiki-prices";

const MAPPING_TTL = 24 * 60 * 60 * 1000;
const PRICES_TTL = 5 * 60 * 1000;

export async function fetchMapping(): Promise<ItemMapping[]> {
  return fetchJson<ItemMapping[]>({
    url: `${WIKI_API}/mapping`,
    cacheKey: "mapping",
    ttlMs: MAPPING_TTL,
    persist: true,
    headers: { "User-Agent": "runewise - osrs companion app" },
  });
}

export async function fetchLatestPrices(): Promise<
  Record<string, ItemPrice>
> {
  return fetchJson<Record<string, ItemPrice>>({
    url: `${WIKI_API}/latest`,
    cacheKey: "prices",
    ttlMs: PRICES_TTL,
    persist: true,
    headers: { "User-Agent": "runewise - osrs companion app" },
    transform: (json) =>
      typeof json === "object" && json !== null && "data" in json
        ? (json as { data: Record<string, ItemPrice> }).data
        : {},
  });
}

export async function fetchVolumes(): Promise<Record<string, number>> {
  return fetchJson<Record<string, number>>({
    url: `${WIKI_API}/volumes`,
    cacheKey: "ge-volumes",
    ttlMs: PRICES_TTL,
    headers: { "User-Agent": "runewise - osrs companion app" },
    transform: (json) =>
      typeof json === "object" && json !== null && "data" in json
        ? (json as { data: Record<string, number> }).data
        : {},
  });
}

export async function searchItems(query: string): Promise<ItemMapping[]> {
  const mapping = await fetchMapping();
  const q = query.toLowerCase();
  return mapping
    .filter((item) => item.name.toLowerCase().includes(q))
    .slice(0, 50);
}
