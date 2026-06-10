import type { ItemPrice } from "../../lib/api/ge";
import type { RaidUnique } from "./data/cox";

export interface RaidEvRow {
  item: RaidUnique;
  gePrice: number | null;
  /** Per-raid rate denominator for this specific item (1/x). */
  itemRate: number | null;
  evPerRaid: number | null;
}

/**
 * Expected raid loot value. `dropRate` is the any-unique rate denominator
 * (one unique per `dropRate` raids). Each item's chance is that rate split
 * by its share of the unique table, so the total EV is the weighted mean
 * unique price divided by the any-unique rate — not the sum of every item
 * at the full rate.
 */
export function computeRaidEv(
  uniques: RaidUnique[],
  itemMap: Map<string, number>,
  prices: Record<string, ItemPrice>,
  dropRate: number
): { rows: RaidEvRow[]; totalEv: number } {
  const tableUniques = uniques.filter((u) => u.weight > 0);
  const totalWeight = tableUniques.reduce((sum, u) => sum + u.weight, 0);

  const rows = tableUniques.map((item) => {
    const id = itemMap.get(item.name.toLowerCase());
    const price = id ? prices[String(id)] : null;
    const gePrice = price?.high ?? price?.low ?? null;
    const itemRate =
      dropRate > 0 ? dropRate / (item.weight / totalWeight) : null;
    const evPerRaid =
      gePrice != null && itemRate != null ? gePrice / itemRate : null;
    return { item, gePrice, itemRate, evPerRaid };
  });

  const totalEv = rows.reduce((sum, r) => sum + (r.evPerRaid ?? 0), 0);
  return { rows, totalEv };
}
