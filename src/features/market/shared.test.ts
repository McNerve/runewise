import { describe, it, expect } from "vitest";
import { priceMargin } from "./shared";

describe("priceMargin", () => {
  it("returns null when either price side is missing", () => {
    expect(priceMargin(undefined)).toBeNull();
    expect(priceMargin({ high: null, highTime: null, low: 100, lowTime: 0 })).toBeNull();
    expect(priceMargin({ high: 100, highTime: 0, low: null, lowTime: null })).toBeNull();
  });

  it("taxes the sale side — a thin positive spread becomes a loss", () => {
    // raw spread +100, but 2% tax on 10,000 is 200
    expect(priceMargin({ high: 10_000, highTime: 0, low: 9_900, lowTime: 0 })).toBe(-100);
    expect(priceMargin({ high: 1_000_000, highTime: 0, low: 900_000, lowTime: 0 })).toBe(80_000);
  });
});
