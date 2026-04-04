/**
 * Kingdom of Miscellania herb drop distribution.
 * Weights sourced from OSRS Wiki — Managing Miscellania loot calculator.
 * Players receive a weighted mix of grimy herbs, not a single type.
 */

interface HerbWeight {
  itemId: number;
  name: string;
  weight: number;
}

export const KINGDOM_HERB_WEIGHTS: HerbWeight[] = [
  { itemId: 203, name: "Grimy tarromin", weight: 959 },
  { itemId: 205, name: "Grimy harralander", weight: 2190 },
  { itemId: 207, name: "Grimy ranarr weed", weight: 10360 },
  { itemId: 209, name: "Grimy irit leaf", weight: 6852 },
  { itemId: 211, name: "Grimy avantoe", weight: 6609 },
  { itemId: 213, name: "Grimy kwuarm", weight: 4746 },
  { itemId: 215, name: "Grimy cadantine", weight: 5264 },
  { itemId: 2485, name: "Grimy lantadyme", weight: 3118 },
  { itemId: 217, name: "Grimy dwarf weed", weight: 3399 },
];

const TOTAL_WEIGHT = KINGDOM_HERB_WEIGHTS.reduce((s, h) => s + h.weight, 0);

export function weightedHerbPrice(
  prices: Record<string, { high?: number | null; low?: number | null }>,
): number | null {
  let total = 0;
  let hasAny = false;
  for (const herb of KINGDOM_HERB_WEIGHTS) {
    const p = prices[String(herb.itemId)];
    const price = p?.high ?? p?.low ?? null;
    if (price != null) {
      total += (herb.weight / TOTAL_WEIGHT) * price;
      hasAny = true;
    }
  }
  return hasAny ? Math.round(total) : null;
}
