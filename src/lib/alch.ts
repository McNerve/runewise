import type { ItemPrice } from "./api/ge";

export const NATURE_RUNE_ID = 561;
const NATURE_RUNE_FALLBACK = 250;

export function natureRunePrice(prices: Record<string, ItemPrice>): number {
  return prices[String(NATURE_RUNE_ID)]?.high ?? NATURE_RUNE_FALLBACK;
}

/** High-alch profit per cast. Alching yields coins, so no GE tax applies. */
export function alchProfit(
  highalch: number,
  buyPrice: number,
  natureRuneCost: number
): number {
  return highalch - buyPrice - natureRuneCost;
}
