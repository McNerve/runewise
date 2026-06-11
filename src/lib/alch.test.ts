import { describe, it, expect } from "vitest";
import { alchProfit, natureRunePrice } from "./alch";

describe("natureRunePrice", () => {
  it("prefers high, falls back to low, then the 250gp constant", () => {
    expect(natureRunePrice({ "561": { high: 110, highTime: 0, low: 95, lowTime: 0 } })).toBe(110);
    expect(natureRunePrice({ "561": { high: null, highTime: null, low: 95, lowTime: 0 } })).toBe(95);
    expect(natureRunePrice({})).toBe(250);
  });
});

describe("alchProfit", () => {
  it("subtracts buy price and rune cost from high alch value", () => {
    expect(alchProfit(60_000, 58_000, 100)).toBe(1_900);
  });
});
