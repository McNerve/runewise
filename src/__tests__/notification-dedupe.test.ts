import { describe, expect, it } from "vitest";

/**
 * Tests for threshold-crossing dedupe logic used in useWatchlist.
 * The hook marks notifiedHigh/notifiedLow true once crossed so the
 * notification fires exactly once per crossing until threshold is reset.
 */

interface WatchItem {
  itemId: number;
  itemName: string;
  thresholdHigh: number | null;
  thresholdLow: number | null;
  notifiedHigh: boolean;
  notifiedLow: boolean;
}

interface ItemPrice {
  high: number | null;
  low: number | null;
}

/** Simulates one polling tick: returns { shouldNotify, updatedItem } */
function checkThresholds(
  item: WatchItem,
  price: ItemPrice
): { notifyHigh: boolean; notifyLow: boolean; updated: WatchItem } {
  const current = price.high ?? price.low ?? null;
  let updated = { ...item };
  let notifyHigh = false;
  let notifyLow = false;

  if (item.thresholdHigh != null && current != null && current >= item.thresholdHigh && !item.notifiedHigh) {
    notifyHigh = true;
    updated = { ...updated, notifiedHigh: true };
  }
  if (item.thresholdLow != null && current != null && current <= item.thresholdLow && !item.notifiedLow) {
    notifyLow = true;
    updated = { ...updated, notifiedLow: true };
  }
  return { notifyHigh, notifyLow, updated };
}

describe("watchlist threshold-crossing dedupe", () => {
  const base: WatchItem = {
    itemId: 1,
    itemName: "Ferocious gloves",
    thresholdHigh: 700_000,
    thresholdLow: 600_000,
    notifiedHigh: false,
    notifiedLow: false,
  };

  it("fires high alert when price exceeds threshold", () => {
    const { notifyHigh } = checkThresholds(base, { high: 750_000, low: null });
    expect(notifyHigh).toBe(true);
  });

  it("fires low alert when price is below threshold", () => {
    const { notifyLow } = checkThresholds(base, { high: null, low: 550_000 });
    expect(notifyLow).toBe(true);
  });

  it("does not fire again after already notified (dedupe)", () => {
    const firstTick = checkThresholds(base, { high: 750_000, low: null });
    expect(firstTick.notifyHigh).toBe(true);

    // Second tick with same price — notifiedHigh is now true
    const secondTick = checkThresholds(firstTick.updated, { high: 750_000, low: null });
    expect(secondTick.notifyHigh).toBe(false);
  });

  it("does not fire when threshold is not set", () => {
    const item: WatchItem = { ...base, thresholdHigh: null, thresholdLow: null };
    const { notifyHigh, notifyLow } = checkThresholds(item, { high: 1_000_000, low: 100_000 });
    expect(notifyHigh).toBe(false);
    expect(notifyLow).toBe(false);
  });

  it("does not fire when price is unavailable", () => {
    const { notifyHigh, notifyLow } = checkThresholds(base, { high: null, low: null });
    expect(notifyHigh).toBe(false);
    expect(notifyLow).toBe(false);
  });

  it("fires independently for high and low on same tick", () => {
    const item: WatchItem = { ...base, thresholdHigh: 500_000, thresholdLow: 900_000 };
    // Absurd scenario but tests independence
    const { notifyHigh, notifyLow } = checkThresholds(item, { high: 600_000, low: 800_000 });
    expect(notifyHigh).toBe(true);
    expect(notifyLow).toBe(true);
  });

  it("resets fire after threshold is updated (notifiedHigh reset to false)", () => {
    const notified: WatchItem = { ...base, notifiedHigh: true };
    // Simulates updateThreshold setting notifiedHigh: false
    const reset: WatchItem = { ...notified, thresholdHigh: 680_000, notifiedHigh: false };
    const { notifyHigh } = checkThresholds(reset, { high: 700_000, low: null });
    expect(notifyHigh).toBe(true);
  });
});
