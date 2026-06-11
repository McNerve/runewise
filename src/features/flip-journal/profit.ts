import { netMargin } from "../../lib/tax";

/** Realized flip profit: GE tax comes off the sale price, per item. */
export function flipProfit(buyPrice: number, sellPrice: number, qty: number): number {
  return netMargin(sellPrice, buyPrice) * qty;
}
