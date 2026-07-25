import { describe, it, expect } from "vitest";

function taskProbability(
  weight: number,
  totalWeight: number,
  blocked: boolean,
  locked: boolean
): number {
  if (blocked || locked || totalWeight <= 0) return 0;
  return (weight / totalWeight) * 100;
}

describe("slayer task probability", () => {
  it("returns 0 when totalWeight is 0 (no NaN)", () => {
    expect(taskProbability(10, 0, false, false)).toBe(0);
    expect(Number.isFinite(taskProbability(10, 0, false, false))).toBe(true);
  });

  it("returns 0 for blocked or locked tasks", () => {
    expect(taskProbability(10, 100, true, false)).toBe(0);
    expect(taskProbability(10, 100, false, true)).toBe(0);
  });

  it("computes percent of total weight", () => {
    expect(taskProbability(25, 100, false, false)).toBe(25);
  });
});
