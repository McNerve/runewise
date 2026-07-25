import { describe, it, expect } from "vitest";
import { boltEnchantHitDistribution, boltEnchantExpectedFromPmf } from "./boltDist";
import { boltEnchantExpectedHit } from "./dps";

describe("bolt enchant PMF", () => {
  it("diamond proc raises EV vs plain mid-accuracy", () => {
    const plain = boltEnchantExpectedFromPmf({
      enchant: "none",
      maxHit: 40,
      accuracy: 0.5,
      targetHp: 200,
      rangedLevel: 99,
    });
    const diamond = boltEnchantExpectedFromPmf({
      enchant: "diamond",
      maxHit: 40,
      accuracy: 0.5,
      targetHp: 200,
      rangedLevel: 99,
    });
    expect(diamond).toBeGreaterThan(plain);
  });

  it("ruby guaranteed proc is min(100, 20% hp)", () => {
    const dist = boltEnchantHitDistribution({
      enchant: "ruby",
      maxHit: 5,
      accuracy: 0,
      targetHp: 1000,
      rangedLevel: 99,
      guaranteedProc: true,
    });
    expect(dist.expectedHit).toBe(100);
  });

  it("dps.boltEnchantExpectedHit matches PMF EV", () => {
    const opts = {
      enchant: "opal" as const,
      maxHit: 30,
      accuracy: 0.7,
      targetHp: 150,
      rangedLevel: 99,
    };
    expect(boltEnchantExpectedHit(opts)).toBeCloseTo(
      boltEnchantExpectedFromPmf(opts),
      8
    );
  });

  it("PMF probabilities sum to ~1", () => {
    const dist = boltEnchantHitDistribution({
      enchant: "diamond",
      maxHit: 25,
      accuracy: 0.6,
      targetHp: 100,
      rangedLevel: 99,
    });
    const sum = dist.pmf.reduce((s, p) => s + p, 0);
    expect(sum).toBeCloseTo(1, 8);
  });
});
