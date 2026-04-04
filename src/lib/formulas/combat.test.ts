import { describe, it, expect } from "vitest";
import { combatLevel, meleeMaxHit, rangedMaxHit } from "./combat";

describe("combatLevel", () => {
  it("fresh account (all 1s, 10 hp) = 3", () => {
    expect(
      combatLevel({
        attack: 1,
        strength: 1,
        defence: 1,
        hitpoints: 10,
        prayer: 1,
        ranged: 1,
        magic: 1,
      })
    ).toBe(3);
  });

  it("maxed account (all 99s) = 126", () => {
    expect(
      combatLevel({
        attack: 99,
        strength: 99,
        defence: 99,
        hitpoints: 99,
        prayer: 99,
        ranged: 99,
        magic: 99,
      })
    ).toBe(126);
  });

  it("pure (99 att/str, 1 def, 99 hp, 1 prayer) = 89", () => {
    expect(
      combatLevel({
        attack: 99,
        strength: 99,
        defence: 1,
        hitpoints: 99,
        prayer: 1,
        ranged: 1,
        magic: 1,
      })
    ).toBe(89);
  });

  it("ranger (99 range, 1 melee, 99 hp) = 73", () => {
    expect(
      combatLevel({
        attack: 1,
        strength: 1,
        defence: 1,
        hitpoints: 99,
        prayer: 1,
        ranged: 99,
        magic: 1,
      })
    ).toBe(73);
  });

  it("mage (99 magic, 1 melee, 99 hp) = 73", () => {
    expect(
      combatLevel({
        attack: 1,
        strength: 1,
        defence: 1,
        hitpoints: 99,
        prayer: 1,
        ranged: 1,
        magic: 99,
      })
    ).toBe(73);
  });

  it("all literal 1s (including hp) = 1", () => {
    expect(
      combatLevel({
        attack: 1,
        strength: 1,
        defence: 1,
        hitpoints: 1,
        prayer: 1,
        ranged: 1,
        magic: 1,
      })
    ).toBe(1);
  });

  it("ranged-based combat is higher than melee-based at same totals", () => {
    // 99 range beats 50 att + 49 str because ranged formula uses 1.5x
    const rangedBuild = combatLevel({
      attack: 1,
      strength: 1,
      defence: 70,
      hitpoints: 70,
      prayer: 44,
      ranged: 99,
      magic: 1,
    });
    const meleeBuild = combatLevel({
      attack: 50,
      strength: 49,
      defence: 70,
      hitpoints: 70,
      prayer: 44,
      ranged: 1,
      magic: 1,
    });
    // ranged uses floor(99/2)+99 = 148 * 0.325 = 48.1
    // melee uses 50+49 = 99 * 0.325 = 32.175
    expect(rangedBuild).toBeGreaterThan(meleeBuild);
  });
});

describe("meleeMaxHit", () => {
  it("99 str, 0 bonus, no prayer = 11", () => {
    expect(meleeMaxHit(99, 0)).toBe(11);
  });

  it("99 str, +118 bonus, no prayer = 30", () => {
    expect(meleeMaxHit(99, 118)).toBe(30);
  });

  it("99 str, +118 bonus, piety (1.23) = 37", () => {
    expect(meleeMaxHit(99, 118, 1.23)).toBe(37);
  });

  it("1 str, 0 bonus = 1", () => {
    expect(meleeMaxHit(1, 0)).toBe(1);
  });

  it("other multiplier stacks with prayer", () => {
    // void melee: otherMultiplier = 1.1
    const withVoid = meleeMaxHit(99, 118, 1.0, 1.1);
    const without = meleeMaxHit(99, 118, 1.0, 1.0);
    expect(withVoid).toBeGreaterThan(without);
  });
});

describe("rangedMaxHit", () => {
  it("99 ranged, 0 bonus, no prayer = 11", () => {
    expect(rangedMaxHit(99, 0)).toBe(11);
  });

  it("99 ranged, +100 bonus = 27", () => {
    expect(rangedMaxHit(99, 100)).toBe(27);
  });

  it("1 ranged, 0 bonus = 1", () => {
    expect(rangedMaxHit(1, 0)).toBe(1);
  });

  it("rigour prayer increases max hit", () => {
    const withRigour = rangedMaxHit(99, 100, 1.23);
    const without = rangedMaxHit(99, 100, 1.0);
    expect(withRigour).toBeGreaterThan(without);
  });
});
