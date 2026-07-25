import { postTaxPrice } from "../../lib/tax";

/**
 * Shop arbitrage: buy from shop for coins, instasell on GE (post-tax).
 * Non-coin currencies are not GP-comparable — return null.
 * Uses GE low (instasell) never high (instabuy).
 */
export function shopSaving(
  geLow: number | null | undefined,
  shopPrice: number | null | undefined,
  currency: string | null | undefined
): number | null {
  if ((currency ?? "Coins") !== "Coins") return null;
  if (geLow == null || shopPrice == null || !Number.isFinite(geLow) || !Number.isFinite(shopPrice)) {
    return null;
  }
  return postTaxPrice(geLow) - shopPrice;
}

/** Resolve GE instasell (low) for a named item. */
export function geInstasell(
  itemName: string,
  prices: Record<string, { high: number | null; low: number | null }>,
  nameToId: Map<string, number>
): number | null {
  const id = nameToId.get(itemName.toLowerCase());
  if (!id) return null;
  const p = prices[String(id)];
  return p?.low ?? null;
}
