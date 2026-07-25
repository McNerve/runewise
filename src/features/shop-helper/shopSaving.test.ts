import { describe, it, expect } from "vitest";
import { shopSaving, geInstasell } from "./shopSaving";

describe("shopSaving", () => {
  it("returns post-tax instasell minus shop price for Coins", () => {
    // GE low 10_000 → tax floor(10000*0.02)=200 → post-tax 9800; shop 5000 → save 4800
    expect(shopSaving(10_000, 5_000, "Coins")).toBe(9_800 - 5_000);
  });

  it("returns null for non-coin currencies", () => {
    expect(shopSaving(10_000, 100, "Tokkul")).toBeNull();
    expect(shopSaving(10_000, 100, "Castle wars tickets")).toBeNull();
  });

  it("defaults missing currency to Coins", () => {
    // 100 gp sale: tax floor(2) = 2 → post-tax 98; shop 40 → save 58
    expect(shopSaving(100, 40, null)).toBe(58);
    expect(shopSaving(100, 40, undefined)).toBe(58);
    // under tax-exempt threshold (<50): no tax
    expect(shopSaving(40, 10, null)).toBe(30);
  });

  it("returns null when prices are missing", () => {
    expect(shopSaving(null, 100, "Coins")).toBeNull();
    expect(shopSaving(100, null, "Coins")).toBeNull();
  });

  it("never uses GE high — only the passed low", () => {
    // Caller must pass low; function has no high argument
    expect(shopSaving(900, 1000, "Coins")).toBe(postTaxish(900) - 1000);
  });
});

function postTaxish(n: number) {
  if (n < 50) return n;
  return n - Math.min(Math.floor(n * 0.02), 5_000_000);
}

describe("geInstasell", () => {
  const nameToId = new Map([["rune scimitar", 1333]]);
  const prices = {
    "1333": { high: 15_000, low: 14_000 },
  };

  it("returns low not high", () => {
    expect(geInstasell("Rune scimitar", prices, nameToId)).toBe(14_000);
  });

  it("returns null for unknown items", () => {
    expect(geInstasell("No such item", prices, nameToId)).toBeNull();
  });
});
