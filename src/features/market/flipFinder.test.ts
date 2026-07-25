import { describe, it, expect } from "vitest";
import { findFlips } from "./flipFinder";
import type { ItemMapping, ItemPrice } from "../../lib/api/ge";

function item(id: number, over: Partial<ItemMapping> = {}): ItemMapping {
  return {
    id,
    name: `Item ${id}`,
    examine: "",
    members: false,
    lowalch: null,
    highalch: null,
    limit: 100,
    value: 0,
    icon: "",
    ...over,
  };
}

function price(low: number | null, high: number | null, t = 1000): ItemPrice {
  return { low, lowTime: t, high, highTime: t };
}

describe("findFlips", () => {
  it("computes tax-correct margin, roi and per-limit profit", () => {
    const [flip] = findFlips([item(1, { limit: 100 })], { "1": price(1000, 2000) }, { "1": 500 });
    // GE tax = floor(2000 * 0.02) = 40 → margin = (2000 - 40) - 1000 = 960
    expect(flip.margin).toBe(960);
    expect(flip.roi).toBeCloseTo(0.96, 5);
    expect(flip.perLimit).toBe(960 * 100);
    expect(flip.volume).toBe(500);
  });

  it("excludes sell<=buy and post-tax-negative margins", () => {
    const mapping = [item(1), item(2)];
    // item2: tax floor(1010*0.02)=20 → margin (1010-20)-1000 = -10
    const prices = { "1": price(1000, 900), "2": price(1000, 1010) };
    expect(findFlips(mapping, prices, {})).toHaveLength(0);
  });

  it("skips items missing a high or low price", () => {
    const prices = { "1": price(null, 2000), "2": price(1000, null) };
    expect(findFlips([item(1), item(2)], prices, {})).toHaveLength(0);
  });

  it("applies budget, minMargin and minVolume filters", () => {
    const mapping = [item(1), item(2)];
    const prices = { "1": price(1000, 2000), "2": price(100, 200) };
    const vols = { "1": 1000, "2": 5 };
    expect(findFlips(mapping, prices, vols, { budget: 500 }).map((f) => f.item.id)).toEqual([2]);
    expect(findFlips(mapping, prices, vols, { minMargin: 500 }).map((f) => f.item.id)).toEqual([1]);
    expect(findFlips(mapping, prices, vols, { minVolume: 100 }).map((f) => f.item.id)).toEqual([1]);
  });

  it("filters by members tier", () => {
    const mapping = [item(1, { members: true }), item(2, { members: false })];
    const prices = { "1": price(1000, 2000), "2": price(1000, 2000) };
    expect(findFlips(mapping, prices, {}, { members: "f2p" }).map((f) => f.item.id)).toEqual([2]);
    expect(findFlips(mapping, prices, {}, { members: "p2p" }).map((f) => f.item.id)).toEqual([1]);
  });

  it("sorts by the requested key and respects the result cap", () => {
    const mapping = [item(1, { limit: 1 }), item(2, { limit: 1000 })];
    // item1: big per-item margin, tiny limit; item2: small margin, huge limit
    const prices = { "1": price(100, 1000), "2": price(900, 1000) };
    expect(findFlips(mapping, prices, {}, { sort: "margin" })[0].item.id).toBe(1);
    expect(findFlips(mapping, prices, {}, { sort: "perLimit" })[0].item.id).toBe(2);
    expect(findFlips(mapping, prices, {}, { limit: 1 })).toHaveLength(1);
  });

  it("reports perLimit 0 when the buy limit is unknown", () => {
    const [flip] = findFlips([item(1, { limit: null })], { "1": price(1000, 2000) }, {});
    expect(flip.limit).toBe(0);
    expect(flip.perLimit).toBe(0);
  });
});

/**
 * Integration-style path: the same pure pipeline the Flip Finder hero strip
 * uses (rank → best/limit → top margin → median ROI).
 */
describe("flip finder hero path", () => {
  function heroMetrics(flips: ReturnType<typeof findFlips>) {
    if (flips.length === 0) return null;
    const topByLimit = flips.reduce((best, f) => (f.perLimit > best.perLimit ? f : best), flips[0]!);
    const topMargin = flips.reduce((best, f) => (f.margin > best.margin ? f : best), flips[0]!);
    const sortedRoi = [...flips].map((f) => f.roi).sort((a, b) => a - b);
    const medianRoi = sortedRoi[Math.floor(sortedRoi.length / 2)]!;
    return { topByLimit, topMargin, medianRoi, count: flips.length };
  }

  it("picks best/limit and top margin from a mixed catalogue", () => {
    const mapping = [
      item(1, { name: "Big margin tiny limit", limit: 1, members: true }),
      item(2, { name: "Small margin huge limit", limit: 10_000, members: false }),
      item(3, { name: "Loser", limit: 100, members: false }),
    ];
    const prices = {
      "1": price(100, 1000), // large margin, tiny limit → wins topMargin
      "2": price(800, 1000), // smaller margin, huge limit → wins perLimit
      "3": price(1000, 1000), // zero margin → excluded
    };
    const flips = findFlips(mapping, prices, { "1": 200, "2": 5000, "3": 999 }, {
      minVolume: 50,
      sort: "perLimit",
    });
    const hero = heroMetrics(flips);
    expect(hero).not.toBeNull();
    expect(hero!.count).toBe(2);
    expect(hero!.topMargin.item.id).toBe(1);
    expect(hero!.topByLimit.item.id).toBe(2);
    expect(hero!.medianRoi).toBeGreaterThan(0);
  });

  it("applies f2p filter before hero ranking", () => {
    const mapping = [
      item(1, { members: true, limit: 100 }),
      item(2, { members: false, limit: 100 }),
    ];
    const prices = { "1": price(100, 500), "2": price(100, 200) };
    const flips = findFlips(mapping, prices, { "1": 1000, "2": 1000 }, { members: "f2p" });
    const hero = heroMetrics(flips);
    expect(hero!.count).toBe(1);
    expect(hero!.topByLimit.item.id).toBe(2);
  });

  it("empty volumes + default minVolume 100 yields no flips (filter-empty, not data-error)", () => {
    const mapping = [item(1, { limit: 100 })];
    const prices = { "1": price(1000, 2000) };
    // Volumes failed/empty → every item volume defaults to 0 → filtered out
    expect(findFlips(mapping, prices, {}, { minVolume: 100 })).toHaveLength(0);
    // UI should disable minVolume on volError; with minVolume 0, flips still appear
    expect(findFlips(mapping, prices, {}, { minVolume: 0 })).toHaveLength(1);
  });
});

