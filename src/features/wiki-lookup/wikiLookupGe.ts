import type { ItemMapping, ItemPrice } from "../../lib/api/ge";

export interface GESnapshot {
  price: number | null;
  buyLimit: number | null;
  dailyVolume: number | null;
}

/**
 * Pure GE enrichment for an item wiki page. Returns null when there's nothing
 * useful to show (untradeable / no market data).
 */
export function buildGeSnapshot(
  pageTitle: string,
  mapping: ItemMapping[],
  prices: Record<string, ItemPrice>,
  volumes?: Record<string, number>
): GESnapshot | null {
  const title = pageTitle.toLowerCase();
  const match = mapping.find((m) => m.name.toLowerCase() === title);
  if (!match) return null;

  const priceEntry = prices[String(match.id)];
  const price = priceEntry?.high ?? priceEntry?.low ?? null;

  // Untradeables can appear in the mapping with no market data — a GE box
  // showing only dashes is noise, not information.
  if (price === null && match.limit == null) return null;

  return {
    price,
    buyLimit: match.limit ?? null,
    dailyVolume: volumes?.[String(match.id)] ?? null,
  };
}

export function wikiKindLabel(kind: "item" | "boss" | "quest" | string): string {
  if (kind === "item") return "Item";
  if (kind === "boss") return "Boss";
  if (kind === "quest") return "Quest";
  return "Wiki";
}
