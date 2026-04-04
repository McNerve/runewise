import { describe, it, expect } from "vitest";
import { xpForLevel, levelForXp, XP_TABLE, MAX_XP, MAX_LEVEL } from "./xp";

describe("xpForLevel", () => {
  it("level 1 = 0", () => {
    expect(xpForLevel(1)).toBe(0);
  });

  it("level 2 = 83", () => {
    expect(xpForLevel(2)).toBe(83);
  });

  it("level 92 = 6,517,253 (half of 99)", () => {
    expect(xpForLevel(92)).toBe(6_517_253);
  });

  it("level 99 = 13,034,431", () => {
    expect(xpForLevel(99)).toBe(13_034_431);
  });

  it("level < 1 returns 0", () => {
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(-5)).toBe(0);
  });

  it("level > 126 clamps to level 126 XP", () => {
    expect(xpForLevel(200)).toBe(xpForLevel(126));
  });

  it("level 126 returns a value > level 99", () => {
    expect(xpForLevel(126)).toBeGreaterThan(xpForLevel(99));
  });
});

describe("levelForXp", () => {
  it("0 XP = level 1", () => {
    expect(levelForXp(0)).toBe(1);
  });

  it("83 XP = level 2", () => {
    expect(levelForXp(83)).toBe(2);
  });

  it("82 XP = level 1 (just under level 2)", () => {
    expect(levelForXp(82)).toBe(1);
  });

  it("13,034,431 XP = level 99", () => {
    expect(levelForXp(13_034_431)).toBe(99);
  });

  it("200,000,000 XP (max) = virtual level above 99", () => {
    // The function supports virtual levels up to 126
    expect(levelForXp(200_000_000)).toBeGreaterThanOrEqual(99);
  });

  it("negative XP = level 1", () => {
    expect(levelForXp(-100)).toBe(1);
  });

  it("XP just below level 99 = level 98", () => {
    expect(levelForXp(13_034_430)).toBe(98);
  });

  it("roundtrip: levelForXp(xpForLevel(n)) = n for all 1-99", () => {
    for (let level = 1; level <= 99; level++) {
      expect(levelForXp(xpForLevel(level))).toBe(level);
    }
  });
});

describe("XP_TABLE", () => {
  it("has 99 entries", () => {
    expect(XP_TABLE).toHaveLength(99);
  });

  it("first entry is level 1 with 0 XP and 0 diff", () => {
    expect(XP_TABLE[0]).toEqual({ level: 1, xp: 0, diff: 0 });
  });

  it("last entry is level 99", () => {
    expect(XP_TABLE[98].level).toBe(99);
    expect(XP_TABLE[98].xp).toBe(13_034_431);
  });

  it("diff is always positive for levels > 1", () => {
    for (let i = 1; i < XP_TABLE.length; i++) {
      expect(XP_TABLE[i].diff).toBeGreaterThan(0);
    }
  });
});

describe("constants", () => {
  it("MAX_XP = 200,000,000", () => {
    expect(MAX_XP).toBe(200_000_000);
  });

  it("MAX_LEVEL = 99", () => {
    expect(MAX_LEVEL).toBe(99);
  });
});
