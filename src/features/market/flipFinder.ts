import type { ItemMapping, ItemPrice } from "../../lib/api/ge";
import { netMargin } from "../../lib/tax";

export interface Flip {
  item: ItemMapping;
  /** Instabuy price — what you place a buy offer near. */
  buy: number;
  /** Instasell price. */
  sell: number;
  /** Post-GE-tax margin per item. */
  margin: number;
  /** margin / buy, as a fraction. */
  roi: number;
  /** Daily traded volume. */
  volume: number;
  /** 4-hour buy limit (0 = unknown). */
  limit: number;
  /** margin × limit — most you can clear per 4-hour cycle (0 if limit unknown). */
  perLimit: number;
  /** Oldest of the two price timestamps (unix seconds). */
  updated: number | null;
}

export type FlipSort = "perLimit" | "margin" | "roi" | "volume";

export interface FlipFilters {
  /** Max buy price you can afford. */
  budget?: number;
  minMargin?: number;
  minVolume?: number;
  members?: "all" | "f2p" | "p2p";
  sort?: FlipSort;
  /** Result cap. */
  limit?: number;
}

/**
 * Rank Grand Exchange flips by tax-correct margin. Pure + deterministic so
 * the money math is unit-tested — getting the 2% sell tax wrong is the single
 * fastest way to lose a flipper's trust.
 */
export function findFlips(
  mapping: ItemMapping[],
  prices: Record<string, ItemPrice>,
  volumes: Record<string, number>,
  filters: FlipFilters = {}
): Flip[] {
  const {
    budget = Infinity,
    minMargin = 0,
    minVolume = 0,
    members = "all",
    sort = "perLimit",
    limit: cap = 80,
  } = filters;

  const out: Flip[] = [];
  for (const item of mapping) {
    if (members === "f2p" && item.members) continue;
    if (members === "p2p" && !item.members) continue;
    const p = prices[String(item.id)];
    if (!p || p.high == null || p.low == null) continue;
    const buy = p.low;
    const sell = p.high;
    if (buy <= 0 || sell <= buy || buy > budget) continue;
    const margin = netMargin(sell, buy);
    if (margin <= 0 || margin < minMargin) continue;
    const volume = volumes[String(item.id)] ?? 0;
    if (volume < minVolume) continue;
    const itemLimit = item.limit ?? 0;
    out.push({
      item,
      buy,
      sell,
      margin,
      roi: margin / buy,
      volume,
      limit: itemLimit,
      perLimit: itemLimit > 0 ? margin * itemLimit : 0,
      updated:
        p.highTime != null && p.lowTime != null
          ? Math.min(p.highTime, p.lowTime)
          : p.highTime ?? p.lowTime,
    });
  }
  out.sort((a, b) => b[sort] - a[sort]);
  return out.slice(0, cap);
}
