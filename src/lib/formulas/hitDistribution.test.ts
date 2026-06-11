import { describe, it, expect } from "vitest";
import { hitDistribution } from "./hitDistribution";

describe("hitDistribution", () => {
  it("sums to 1", () => {
    const { pmf } = hitDistribution(47, 0.73);
    const total = pmf.reduce((s, p) => s + p, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it("puts miss mass plus the zero roll in the zero bucket", () => {
    const { pmf, zeroChance } = hitDistribution(10, 0.6);
    // 0.4 miss + 0.6/11 for the connecting 0-roll
    expect(zeroChance).toBeCloseTo(0.4 + 0.6 / 11, 10);
    expect(pmf[0]).toBeCloseTo(zeroChance, 10);
  });

  it("spreads connecting hits uniformly", () => {
    const { pmf } = hitDistribution(10, 0.6);
    for (let k = 1; k <= 10; k++) {
      expect(pmf[k]).toBeCloseTo(0.6 / 11, 10);
    }
  });

  it("matches the analytic expected hit", () => {
    const { expectedHit } = hitDistribution(40, 0.5);
    expect(expectedHit).toBeCloseTo(10, 10);
  });

  it("handles guaranteed accuracy", () => {
    const { pmf, zeroChance } = hitDistribution(4, 1);
    expect(zeroChance).toBeCloseTo(1 / 5, 10);
    expect(pmf).toHaveLength(5);
  });

  it("handles zero max hit", () => {
    const dist = hitDistribution(0, 0.9);
    expect(dist.pmf).toEqual([1]);
    expect(dist.expectedHit).toBe(0);
    expect(dist.medianHit).toBe(0);
  });

  it("clamps out-of-range accuracy", () => {
    expect(hitDistribution(10, 1.5).zeroChance).toBeCloseTo(1 / 11, 10);
    expect(hitDistribution(10, -1).zeroChance).toBe(1);
  });

  it("computes the median damage", () => {
    // accuracy 1, max 10: cdf hits 0.5 at k=5 (6/11 > 0.5)
    expect(hitDistribution(10, 1).medianHit).toBe(5);
    // low accuracy: zero bucket alone exceeds 0.5
    expect(hitDistribution(10, 0.3).medianHit).toBe(0);
  });
});
