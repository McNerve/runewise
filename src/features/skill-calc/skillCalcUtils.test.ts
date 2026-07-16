import { describe, it, expect } from "vitest";
import { xpForLevel } from "../../lib/formulas/xp";
import type { TrainingMethod } from "../../lib/data/training-methods";
import {
  actionsForXp,
  clampTargetLevel,
  computeXpNeeded,
  defaultTargetLevel,
  filterMethodsByIntensity,
  hoursForXp,
  normalizeSkill,
} from "./skillCalcUtils";

describe("normalizeSkill", () => {
  it("matches case-insensitively", () => {
    expect(normalizeSkill("attack")).toBe("Attack");
    expect(normalizeSkill("WOODCUTTING")).toBe("Woodcutting");
  });

  it("returns null for unknown or empty", () => {
    expect(normalizeSkill(undefined)).toBeNull();
    expect(normalizeSkill("")).toBeNull();
    expect(normalizeSkill("NotASkill")).toBeNull();
  });
});

describe("clampTargetLevel", () => {
  it("clamps to 2–99 and rounds", () => {
    expect(clampTargetLevel(1)).toBe(2);
    expect(clampTargetLevel(150)).toBe(99);
    expect(clampTargetLevel(50.6)).toBe(51);
    expect(clampTargetLevel(Number.NaN)).toBe(2);
  });
});

describe("defaultTargetLevel", () => {
  it("prefers custom target", () => {
    expect(defaultTargetLevel(50, 70)).toBe(70);
  });

  it("uses next level under 99", () => {
    expect(defaultTargetLevel(70)).toBe(71);
  });

  it("defaults to 99 when maxed or unknown", () => {
    expect(defaultTargetLevel(99)).toBe(99);
    expect(defaultTargetLevel(null)).toBe(99);
  });
});

describe("computeXpNeeded", () => {
  it("computes remaining XP to target level", () => {
    const current = xpForLevel(50);
    const { targetXp, xpNeeded } = computeXpNeeded(current, 60);
    expect(targetXp).toBe(xpForLevel(60));
    expect(xpNeeded).toBe(xpForLevel(60) - current);
  });

  it("supports 200M chase and floors at zero", () => {
    const { targetXp, xpNeeded } = computeXpNeeded(199_999_000, 99, true);
    expect(targetXp).toBe(200_000_000);
    expect(xpNeeded).toBe(1000);
    expect(computeXpNeeded(xpForLevel(99), 50).xpNeeded).toBe(0);
  });
});

describe("filterMethodsByIntensity", () => {
  const methods: TrainingMethod[] = [
    { name: "AFK", xp: 10, intensity: "afk" },
    { name: "High", xp: 20, intensity: "high" },
    { name: "None", xp: 5 },
  ];

  it("returns all when filter is All", () => {
    expect(filterMethodsByIntensity(methods, "All")).toHaveLength(3);
  });

  it("filters by intensity case-insensitively", () => {
    expect(filterMethodsByIntensity(methods, "AFK").map((m) => m.name)).toEqual(["AFK"]);
    expect(filterMethodsByIntensity(methods, "high")).toHaveLength(1);
  });
});

describe("actionsForXp / hoursForXp", () => {
  it("ceils actions and rejects invalid rates", () => {
    expect(actionsForXp(100, 30)).toBe(4);
    expect(actionsForXp(0, 30)).toBe(0);
    expect(actionsForXp(100, 0)).toBe(0);
  });

  it("estimates hours from XP/hr", () => {
    expect(hoursForXp(50_000, 25_000)).toBe(2);
    expect(hoursForXp(50_000, undefined)).toBeNull();
  });
});
