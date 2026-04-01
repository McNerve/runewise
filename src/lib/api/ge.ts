import { getCached, setCache } from "./cache";
import { apiFetch } from "./fetch";
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
  const cached = getCached<ItemMapping[]>("mapping", MAPPING_TTL);
  if (cached) return cached;

  const res = await apiFetch(`${WIKI_API}/mapping`, {
    headers: { "User-Agent": "runewise - osrs companion app" },
  });
  if (!res.ok) throw new Error(`Wiki mapping API error: ${res.status}`);
  const data: ItemMapping[] = await res.json();
  setCache("mapping", data);
  return data;
}

export async function fetchLatestPrices(): Promise<
  Record<string, ItemPrice>
> {
  const cached = getCached<Record<string, ItemPrice>>("prices", PRICES_TTL);
  if (cached) return cached;

  const res = await apiFetch(`${WIKI_API}/latest`, {
    headers: { "User-Agent": "runewise - osrs companion app" },
  });
  if (!res.ok) throw new Error(`Wiki prices API error: ${res.status}`);
  const json = await res.json();
  setCache("prices", json.data);
  return json.data;
}

export async function searchItems(query: string): Promise<ItemMapping[]> {
  const mapping = await fetchMapping();
  const q = query.toLowerCase();
  return mapping
    .filter((item) => item.name.toLowerCase().includes(q))
    .slice(0, 50);
}
