import { describe, it, expect } from "vitest";
import { geTax, postTaxPrice, netMargin, GE_TAX_CAP } from "./tax";

describe("geTax", () => {
  it("charges 2% of the sale price, rounded down", () => {
    expect(geTax(1000)).toBe(20);
    expect(geTax(2_100_000)).toBe(42_000);
    expect(geTax(99)).toBe(1); // floor(1.98)
  });

  it("exempts sales under 50 gp", () => {
    expect(geTax(49)).toBe(0);
    expect(geTax(1)).toBe(0);
    expect(geTax(50)).toBe(1);
  });

  it("caps at 5m per item", () => {
    expect(geTax(250_000_000)).toBe(GE_TAX_CAP);
    expect(geTax(1_000_000_000)).toBe(GE_TAX_CAP);
    expect(geTax(249_999_999)).toBe(4_999_999);
  });
});

describe("postTaxPrice", () => {
  it("returns what the seller receives", () => {
    expect(postTaxPrice(2_100_000)).toBe(2_058_000);
    expect(postTaxPrice(40)).toBe(40);
  });
});

describe("netMargin", () => {
  it("taxes the sale side only", () => {
    // buy 10,000 / sell 10,100: tax 202 → real margin is a loss
    expect(netMargin(10_100, 10_000)).toBe(-102);
    expect(netMargin(1_000_000, 900_000)).toBe(80_000);
  });
});
