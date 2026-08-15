import { describe, expect, it } from "vitest";
import { accuracyTier, dpsVerdict, formatTtk } from "./dpsVerdict";

describe("accuracyTier", () => {
  it("splits at 80% and 50%", () => {
    expect(accuracyTier(0.91)).toBe("high");
    expect(accuracyTier(0.8)).toBe("high");
    expect(accuracyTier(0.64)).toBe("moderate");
    expect(accuracyTier(0.31)).toBe("low");
  });
});

describe("formatTtk", () => {
  it("formats seconds and minutes", () => {
    expect(formatTtk(14.2)).toBe("14.2s");
    expect(formatTtk(138)).toBe("2m 18s");
    expect(formatTtk(Number.POSITIVE_INFINITY)).toBe("—");
  });
});

describe("dpsVerdict", () => {
  it("writes a kill-time sentence with an accuracy follow-up", () => {
    const line = dpsVerdict({
      monsterName: "Vorkath",
      dps: 5.41,
      ttk: 138,
      accuracy: 0.64,
    });
    expect(line).toContain("Vorkath dies in 2m 18s at 5.41 DPS (64% accurate)");
    expect(line).toMatch(/Accuracy is the bottleneck/i);
  });

  it("flags zero damage", () => {
    expect(
      dpsVerdict({ monsterName: null, dps: 0, ttk: Infinity, accuracy: 0 })
    ).toMatch(/No damage/);
  });

  it("tells high-accuracy setups to chase max hit", () => {
    expect(
      dpsVerdict({
        monsterName: "Abyssal demon",
        dps: 6.84,
        ttk: 14.2,
        accuracy: 0.91,
      })
    ).toMatch(/High accuracy/);
  });
});
