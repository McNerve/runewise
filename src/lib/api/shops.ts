import { bucketQueryAll } from "./bucket";
import { getCached, setCache } from "./cache";
import { apiFetch } from "./fetch";
import { isTauri } from "../env";

const CACHE_KEY = "wiki-shops:v1";
const CACHE_TTL = 24 * 60 * 60 * 1000;

const SHOP_FIELDS = [
  "page_name",
  "sold_by",
  "sold_item",
  "sold_item_image",
  "store_stock",
  "restock_time",
  "store_sell_price",
  "store_buy_price",
  "store_currency",
  "sold_item_json",
] as const;

interface RawStoreLine {
  [key: string]: unknown;
  page_name: string;
  sold_by?: string;
  sold_item?: string;
  sold_item_image?: string;
  store_stock?: string;
  restock_time?: string;
  store_sell_price?: string;
  store_buy_price?: string;
  store_currency?: string;
  sold_item_json?: string;
}

export interface ShopItem {
  name: string;
  image: string | null;
  stock: string;
  sellPrice: number | null;
  buyPrice: number | null;
  currency: string;
  restockTime: string | null;
}

export interface Shop {
  name: string;
  location: string | null;
  members: boolean;
  items: ShopItem[];
}

function parseNum(v: string | undefined): number | null {
  if (!v || v === "N/A") return null;
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
}

function parseImage(raw: string | undefined): string | null {
  if (!raw) return null;
  return raw.replace(/^File:/, "").replace(/ /g, "_");
}

function cleanWikiText(raw: string): string {
  return raw
    // Strip wikilinks: [[Page|Display]] → Display, [[Page]] → Page
    .replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, "$2")
    .replace(/\[\[([^\]]*)\]\]/g, "$1")
    // Strip all HTML tags
    .replace(/<[^>]+>/g, "")
    // Decode HTML entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#91;/g, "[")
    .replace(/&#93;/g, "]")
    .replace(/&bull;/g, "")
    .replace(/&quot;/g, '"')
    // Clean up whitespace
    .replace(/\s+/g, " ")
    .trim();
}

function parseJson(raw: string | undefined): { members: boolean; location: string | null } {
  if (!raw) return { members: false, location: null };
  try {
    const data = JSON.parse(raw);
    const members = data.Members === "Yes";
    const rawLocation = data.Location ?? null;
    const location = rawLocation ? cleanWikiText(rawLocation) || null : null;
    return { members, location };
  } catch {
    return { members: false, location: null };
  }
}

let shopPromise: Promise<Shop[]> | null = null;

export async function fetchAllShops(): Promise<Shop[]> {
  const cached = getCached<Shop[]>(CACHE_KEY, CACHE_TTL, { persist: true });
  if (cached) return cached;

  if (!shopPromise) {
    shopPromise = bucketQueryAll<RawStoreLine>("storeline", [...SHOP_FIELDS])
      .then((raw) => {
        const grouped = new Map<string, { items: RawStoreLine[]; meta: { members: boolean; location: string | null } }>();

        for (const row of raw) {
          // OSRS wiki shop names sometimes ship with a trailing period (e.g.
          // "Aaron's Archery Appendages."). Strip it so the UI reads cleanly.
          const shopName = (row.sold_by ?? row.page_name).replace(/\.\s*$/, "").trim();
          if (!grouped.has(shopName)) {
            const meta = parseJson(row.sold_item_json);
            grouped.set(shopName, { items: [], meta });
          }
          grouped.get(shopName)!.items.push(row);
        }

        const shops: Shop[] = [];
        for (const [name, { items, meta }] of grouped) {
          shops.push({
            name,
            location: meta.location,
            members: meta.members,
            items: items.map((row) => ({
              name: row.sold_item ?? "Unknown",
              image: parseImage(row.sold_item_image),
              stock: row.store_stock ?? "?",
              sellPrice: parseNum(row.store_sell_price),
              buyPrice: parseNum(row.store_buy_price),
              currency: row.store_currency ?? "Coins",
              restockTime: row.restock_time && row.restock_time !== "N/A" ? row.restock_time : null,
            })),
          });
        }

        const sortKey = (name: string) => name.replace(/[^a-z0-9]/gi, "").toLowerCase();
        shops.sort((a, b) => sortKey(a.name).localeCompare(sortKey(b.name)));
        if (shops.length > 0) setCache(CACHE_KEY, shops, { persist: true });
        shopPromise = null;
        return shops;
      })
      .catch((err: unknown) => {
        shopPromise = null;
        console.error("[RuneWise] Failed to fetch shops:", err);
        throw err;
      });
  }

  return shopPromise;
}

const imageCache = new Map<string, string | null>();

export async function fetchShopImage(shopName: string): Promise<string | null> {
  if (imageCache.has(shopName)) return imageCache.get(shopName) ?? null;

  const wikiPage = shopName.replace(/ /g, "_");
  const url = isTauri
    ? `https://oldschool.runescape.wiki/api.php?action=query&titles=${encodeURIComponent(wikiPage)}&prop=pageimages&format=json&pithumbsize=600`
    : `/api/wiki-content?action=query&titles=${encodeURIComponent(wikiPage)}&prop=pageimages&format=json&pithumbsize=600`;

  try {
    const res = await apiFetch(url);
    if (!res.ok) { imageCache.set(shopName, null); return null; }
    const json = await res.json();
    const pages = json?.query?.pages ?? {};
    const page = Object.values(pages)[0] as Record<string, unknown> | undefined;
    const thumb = (page?.thumbnail as Record<string, unknown>)?.source as string | undefined;
    const result = thumb ?? null;
    imageCache.set(shopName, result);
    return result;
  } catch {
    imageCache.set(shopName, null);
    return null;
  }
}

export function searchShops(shops: Shop[], query: string): Shop[] {
  if (!query.trim()) return shops;
  const lower = query.toLowerCase();
  return shops.filter(
    (s) =>
      s.name.toLowerCase().includes(lower) ||
      (s.location && s.location.toLowerCase().includes(lower)) ||
      s.items.some((i) => i.name.toLowerCase().includes(lower))
  );
}
