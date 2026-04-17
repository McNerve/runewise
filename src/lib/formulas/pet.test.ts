import { describe, it, expect } from "vitest";
import { petChance, actionsForChance, skillingPetRate } from "./pet";

describe("petChance", () => {
  it("same formula as dropChance — 1/3000 rate, 3000 actions ~ 63.2%", () => {
    expect(petChance(3000, 3000)).toBeCloseTo(0.6321, 3);
  });

  it("0 actions = 0%", () => {
    expect(petChance(0, 3000)).toBe(0);
  });

  it("1 action at 1/1 rate = 100%", () => {
    expect(petChance(1, 1)).toBe(1);
  });

  it("1 action at 1/5000 rate ~ 0.02%", () => {
    expect(petChance(1, 5000)).toBeCloseTo(0.0002, 4);
  });
});

describe("actionsForChance", () => {
  it("1/3000 rate, 50% chance = 2080", () => {
    expect(actionsForChance(3000, 0.5)).toBe(2080);
  });

  it("1/3000 rate, 95% chance = 8986", () => {
    expect(actionsForChance(3000, 0.95)).toBe(8986);
  });

  it("1/1 rate returns 0 (guaranteed, log(0) edge case)", () => {
    expect(actionsForChance(1, 0.5)).toBe(0);
  });

  it("higher target chance requires more actions", () => {
    const a50 = actionsForChance(5000, 0.5);
    const a95 = actionsForChance(5000, 0.95);
    const a99 = actionsForChance(5000, 0.99);
    expect(a95).toBeGreaterThan(a50);
    expect(a99).toBeGreaterThan(a95);
  });

  it("roundtrip: petChance(actionsForChance(r, c), r) >= c", () => {
    const rate = 2500;
    const target = 0.9;
    const actions = actionsForChance(rate, target);
    expect(petChance(actions, rate)).toBeGreaterThanOrEqual(target);
  });
});

describe("skillingPetRate (Magic trees B=72_321)", () => {
  const B = 72_321;

  it("L1: 1 / (B - 25)", () => {
    expect(skillingPetRate(B, 1, false)).toBe(B - 25);
  });

  it("L50: 1 / (B - 1250)", () => {
    expect(skillingPetRate(B, 50, false)).toBe(B - 25 * 50);
  });

  it("L70: 1 / (B - 1750)", () => {
    expect(skillingPetRate(B, 70, false)).toBe(B - 25 * 70);
  });

  it("L99: 1 / (B - 2475)", () => {
    expect(skillingPetRate(B, 99, false)).toBe(B - 25 * 99);
  });

  it("caps at L99 for levels above 99", () => {
    expect(skillingPetRate(B, 120, false)).toBe(skillingPetRate(B, 99, false));
  });

  it("clamps levels below 1 to 1", () => {
    expect(skillingPetRate(B, 0, false)).toBe(skillingPetRate(B, 1, false));
  });

  it("200M XP applies 15x multiplier at L99", () => {
    const base = skillingPetRate(B, 99, false);
    expect(skillingPetRate(B, 99, true)).toBe(base / 15);
  });

  it("chance at 200M is 15x the chance without", () => {
    const without = 1 / skillingPetRate(B, 99, false);
    const with200m = 1 / skillingPetRate(B, 99, true);
    expect(with200m / without).toBeCloseTo(15, 10);
  });
});
