import { describe, it, expect } from "vitest";
import { hitDistribution, killTimeStats } from "./hitDistribution";

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

describe("killTimeStats", () => {
  it("matches the geometric case: max 1, hp 1, accuracy 1", () => {
    // Each attack kills with probability 1/2 → expected 2 attacks,
    // median 1 (P=0.5), p90 at n=4 (1 - (1/2)^4 = 0.9375).
    const stats = killTimeStats(1, 1, 1, 4)!;
    expect(stats.expectedAttacks).toBeCloseTo(2, 10);
    expect(stats.expectedSeconds).toBeCloseTo(2 * 4 * 0.6, 10);
    expect(stats.medianAttacks).toBe(1);
    expect(stats.p90Attacks).toBe(4);
  });

  it("matches the per-attack kill chance for max 2, hp 1", () => {
    // Kill chance per attack = 2/3 → expected 1.5 attacks, p90 at n=3.
    const stats = killTimeStats(2, 1, 1, 4)!;
    expect(stats.expectedAttacks).toBeCloseTo(1.5, 10);
    expect(stats.medianAttacks).toBe(1);
    expect(stats.p90Attacks).toBe(3);
  });

  it("chains expectations across hp states: max 1, hp 2", () => {
    // Two successes needed, each geometric with p=1/2 → expected 4 attacks.
    const stats = killTimeStats(1, 1, 2, 4)!;
    expect(stats.expectedAttacks).toBeCloseTo(4, 10);
  });

  it("is never faster than the naive hp / dps estimate", () => {
    // Overkill wastes damage, so true expected time >= naive time.
    for (const [maxHit, acc, hp] of [
      [47, 0.73, 250],
      [12, 0.4, 30],
      [80, 0.95, 100],
    ] as const) {
      const stats = killTimeStats(maxHit, acc, hp, 4)!;
      const naiveDps = (maxHit * acc) / (2 * 4 * 0.6);
      expect(stats.expectedSeconds).toBeGreaterThanOrEqual(hp / naiveDps - 1e-9);
    }
  });

  it("returns null when a kill is impossible", () => {
    expect(killTimeStats(0, 1, 100, 4)).toBeNull();
    expect(killTimeStats(50, 0, 100, 4)).toBeNull();
  });

  it("orders percentiles sensibly", () => {
    const stats = killTimeStats(30, 0.6, 200, 5)!;
    expect(stats.medianAttacks).not.toBeNull();
    expect(stats.p90Attacks).not.toBeNull();
    expect(stats.p90Attacks!).toBeGreaterThanOrEqual(stats.medianAttacks!);
    expect(stats.expectedAttacks).toBeGreaterThan(0);
  });
});
