import { describe, it, expect } from "vitest";
import { dropChance, killsForConfidence, dryPercentile } from "./dry";

describe("dropChance", () => {
  it("1/100 rate, 100 kills ~ 63.4%", () => {
    const chance = dropChance(100, 100);
    expect(chance).toBeCloseTo(0.6340, 3);
  });

  it("1/1 rate, 1 kill = 100%", () => {
    expect(dropChance(1, 1)).toBe(1);
  });

  it("0 kills = 0%", () => {
    expect(dropChance(0, 100)).toBe(0);
  });

  it("1/5000 rate, 1 kill ~ 0.02%", () => {
    const chance = dropChance(1, 5000);
    expect(chance).toBeCloseTo(0.0002, 4);
  });

  it("1/50 rate, 50 kills ~ 63.6%", () => {
    const chance = dropChance(50, 50);
    expect(chance).toBeCloseTo(0.636, 2);
  });

  it("very large kill count approaches 100%", () => {
    const chance = dropChance(10000, 100);
    expect(chance).toBeGreaterThan(0.99);
  });

  it("1/2 rate, 1 kill = 50%", () => {
    expect(dropChance(1, 2)).toBe(0.5);
  });
});

describe("killsForConfidence", () => {
  it("1/100 rate, 95% confidence = 299", () => {
    expect(killsForConfidence(100, 0.95)).toBe(299);
  });

  it("1/100 rate, 50% confidence = 69", () => {
    expect(killsForConfidence(100, 0.5)).toBe(69);
  });

  it("1/1 rate returns 0 (guaranteed drop, log(0) edge case)", () => {
    // log(1 - 1/1) = log(0) = -Infinity, ceil(-Infinity / -Infinity) = NaN → 0
    expect(killsForConfidence(1, 0.5)).toBe(0);
  });

  it("1/5000 rate, 99% confidence", () => {
    const kills = killsForConfidence(5000, 0.99);
    // Should be around 23,025
    expect(kills).toBeGreaterThan(23000);
    expect(kills).toBeLessThan(23100);
  });

  it("higher confidence requires more kills", () => {
    const k50 = killsForConfidence(100, 0.5);
    const k95 = killsForConfidence(100, 0.95);
    const k99 = killsForConfidence(100, 0.99);
    expect(k95).toBeGreaterThan(k50);
    expect(k99).toBeGreaterThan(k95);
  });
});

describe("dryPercentile", () => {
  it("returns dropChance * 100", () => {
    expect(dryPercentile(100, 100)).toBeCloseTo(63.4, 0);
  });

  it("0 kills = 0 percentile", () => {
    expect(dryPercentile(0, 100)).toBe(0);
  });

  it("very dry (5x rate) > 99 percentile", () => {
    expect(dryPercentile(500, 100)).toBeGreaterThan(99);
  });
});
