import { describe, it, expect } from "vitest";
import { petChance, actionsForChance } from "./pet";

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
