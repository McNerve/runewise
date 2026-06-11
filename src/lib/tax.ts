// Grand Exchange sell tax (May 2025 rules): 2% of the sale price per item,
// rounded down, capped at 5,000,000 gp per item. Sales under 50 gp are exempt.
// Buyers pay no tax.
export const GE_TAX_RATE = 0.02;
export const GE_TAX_CAP = 5_000_000;
export const GE_TAX_EXEMPT_BELOW = 50;

export function geTax(sellPrice: number): number {
  if (sellPrice < GE_TAX_EXEMPT_BELOW) return 0;
  return Math.min(Math.floor(sellPrice * GE_TAX_RATE), GE_TAX_CAP);
}

/** What the seller actually receives per item after GE tax. */
export function postTaxPrice(sellPrice: number): number {
  return sellPrice - geTax(sellPrice);
}

/** Flip margin: buy at `low`, sell at `high`, pay tax on the sale. */
export function netMargin(high: number, low: number): number {
  return postTaxPrice(high) - low;
}
