import { describe, it, expect } from "vitest";
import { computeRaidEv } from "./raidEv";
import { COX_UNIQUES } from "./data/cox";
import type { ItemPrice } from "../../lib/api/ge";

function priceMap(entries: [number, number][]): Record<string, ItemPrice> {
  const out: Record<string, ItemPrice> = {};
  for (const [id, price] of entries) {
    out[String(id)] = { high: price, highTime: 0, low: price, lowTime: 0 };
  }
  return out;
}

describe("computeRaidEv", () => {
  const itemMap = new Map(COX_UNIQUES.map((u, i) => [u.name.toLowerCase(), i + 1]));
  const dropRate = 28.9; // any-unique rate at ~30K CoX points

  it("totals to weighted-mean price / any-unique rate, not the sum of all items", () => {
    // All uniques priced at 1m: total EV must be exactly 1m / dropRate,
    // regardless of how many items are on the table.
    const prices = priceMap(COX_UNIQUES.map((_, i) => [i + 1, 1_000_000]));
    const { totalEv } = computeRaidEv(COX_UNIQUES, itemMap, prices, dropRate);
    expect(totalEv).toBeCloseTo(1_000_000 / dropRate, 0);
  });

  it("splits an item's rate by its table weight", () => {
    const prices = priceMap(COX_UNIQUES.map((_, i) => [i + 1, 1_000_000]));
    const { rows } = computeRaidEv(COX_UNIQUES, itemMap, prices, dropRate);
    const tbow = rows.find((r) => r.item.name === "Twisted bow")!;
    // Twisted bow is 2/69 of unique rolls → 1/(28.9 × 69/2) ≈ 1/997 per raid.
    expect(tbow.itemRate).toBeCloseTo(28.9 * (69 / 2), 1);
    expect(tbow.evPerRaid).toBeCloseTo(1_000_000 / (28.9 * 34.5), 0);
  });

  it("excludes the pet from the table and EV", () => {
    const prices = priceMap(COX_UNIQUES.map((_, i) => [i + 1, 1_000_000]));
    const { rows } = computeRaidEv(COX_UNIQUES, itemMap, prices, dropRate);
    expect(rows).toHaveLength(12);
    expect(rows.some((r) => r.item.name === "Olmlet")).toBe(false);
  });

  it("handles missing prices without poisoning the total", () => {
    const prices = priceMap([[1, 1_000_000]]); // only Twisted bow priced
    const { rows, totalEv } = computeRaidEv(COX_UNIQUES, itemMap, prices, dropRate);
    expect(rows.filter((r) => r.evPerRaid != null)).toHaveLength(1);
    // No renormalization over priced-only items: total is exactly tbow's EV.
    expect(totalEv).toBeCloseTo(1_000_000 / (28.9 * 34.5), 0);
  });

  it("resolves GE prices via geName for untradeable charged variants", () => {
    const uniques = [
      { name: "Scythe of vitur", geName: "Scythe of vitur (uncharged)", pointsRequired: "x", rateDescription: "", weight: 1 },
    ];
    const map = new Map([["scythe of vitur (uncharged)", 42]]);
    const { rows } = computeRaidEv(uniques, map, priceMap([[42, 500_000_000]]), 10);
    expect(rows[0]!.gePrice).toBe(500_000_000);
  });
});
