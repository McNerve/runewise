import { describe, it, expect } from "vitest";
import { incomingDps, type MonsterOffence, type PlayerDefence } from "./incomingDps";

function monster(over: Partial<MonsterOffence> = {}): MonsterOffence {
  return {
    maxHit: 20,
    attackSpeed: 4,
    attackStyles: ["Melee"],
    attackLevel: 200,
    magicLevel: 150,
    rangedLevel: 150,
    attackBonus: 50,
    magicAttackBonus: 40,
    rangedAttackBonus: 40,
    ...over,
  };
}

function player(over: Partial<PlayerDefence> = {}): PlayerDefence {
  return {
    defenceLevel: 99,
    magicLevel: 99,
    defStab: 200,
    defSlash: 220,
    defCrush: 210,
    defMagic: 100,
    defRanged: 250,
    stanceDefenceBonus: 0,
    ...over,
  };
}

describe("incomingDps", () => {
  it("returns null for monsters that cannot hit", () => {
    expect(incomingDps(monster({ maxHit: 0 }), player())).toBeNull();
  });

  it("computes one threat per distinct attack type", () => {
    const result = incomingDps(
      monster({ attackStyles: ["Melee", "Magic", "Ranged", "Slash"] }),
      player()
    )!;
    // Melee and Slash collapse into one slash threat.
    expect(result.threats).toHaveLength(3);
    const types = result.threats.map((t) => t.attackType).sort();
    expect(types).toEqual(["magic", "ranged", "slash"]);
  });

  it("uses the matching gear defence bonus per type", () => {
    const tanky = incomingDps(monster(), player({ defSlash: 300 }))!;
    const squishy = incomingDps(monster(), player({ defSlash: 0 }))!;
    expect(tanky.worst.accuracy).toBeLessThan(squishy.worst.accuracy);
    expect(tanky.worst.dps).toBeLessThan(squishy.worst.dps);
  });

  it("blends magic defence from magic and defence levels", () => {
    const highMagic = incomingDps(
      monster({ attackStyles: ["Magic"] }),
      player({ magicLevel: 99 })
    )!;
    const lowMagic = incomingDps(
      monster({ attackStyles: ["Magic"] }),
      player({ magicLevel: 1 })
    )!;
    expect(highMagic.worst.accuracy).toBeLessThan(lowMagic.worst.accuracy);
  });

  it("ranks the worst style first", () => {
    const result = incomingDps(
      monster({ attackStyles: ["Melee", "Magic"] }),
      // Hopeless magic defence → magic should be the worst threat.
      player({ defMagic: -50, magicLevel: 1, defSlash: 300 })
    )!;
    expect(result.worst.attackType).toBe("magic");
    expect(result.threats[0].dps).toBeGreaterThanOrEqual(result.threats[1].dps);
  });

  it("falls back to 4-tick speed and flags it", () => {
    const result = incomingDps(monster({ attackSpeed: 0 }), player())!;
    expect(result.assumedAttackSpeed).toBe(true);
    const explicit = incomingDps(monster({ attackSpeed: 4 }), player())!;
    expect(result.worst.dps).toBeCloseTo(explicit.worst.dps, 10);
  });

  it("expected dps equals accuracy x avg hit / attack interval", () => {
    const result = incomingDps(monster({ attackStyles: ["Melee"] }), player())!;
    const t = result.worst;
    expect(t.dps).toBeCloseTo((t.accuracy * 10) / 2.4, 10);
  });

  it("protection prayers zero out the matching style only", () => {
    const result = incomingDps(
      monster({ attackStyles: ["Melee", "Magic"] }),
      player(),
      "melee"
    )!;
    const melee = result.threats.find((t) => t.attackType === "slash")!;
    const magic = result.threats.find((t) => t.attackType === "magic")!;
    expect(melee.prayedOff).toBe(true);
    expect(melee.dps).toBe(0);
    expect(magic.prayedOff).toBe(false);
    expect(magic.dps).toBeGreaterThan(0);
    // Worst threat shifts to the unprayed style.
    expect(result.worst.attackType).toBe("magic");
  });

  it("protect from melee covers stab, slash, and crush", () => {
    const result = incomingDps(
      monster({ attackStyles: ["Stab", "Slash", "Crush"] }),
      player(),
      "melee"
    )!;
    expect(result.threats.every((t) => t.prayedOff && t.dps === 0)).toBe(true);
  });
});
