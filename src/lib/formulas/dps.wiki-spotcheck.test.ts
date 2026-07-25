/**
 * Side-by-side spot checks against weirdgloop/osrs-dps-calc formula rules.
 * Source: BaseCalc.getNormalAccuracyRoll / getFangAccuracyRoll,
 * PlayerVsNPCCalc tbowScaling, effective-level constants (+8 melee/ranged, +9 magic).
 *
 * Live tool: https://tools.runescape.wiki/osrs-dps/
 */
import { describe, it, expect } from "vitest";
import {
  calculateDps,
  effectiveLevel,
  maxHit,
  attackRoll,
  defenseRoll,
  hitChance,
  fangHitChance,
  tbowScaling,
  DPS_MODIFIERS,
  type DpsInput,
} from "./dps";

function input(overrides: Partial<DpsInput> = {}): DpsInput {
  return {
    attackLevel: 99,
    strengthLevel: 99,
    rangedLevel: 99,
    magicLevel: 99,
    attackBonus: 0,
    strengthBonus: 0,
    prayerAttackMult: 1,
    prayerStrengthMult: 1,
    stanceAttackBonus: 0,
    stanceStrengthBonus: 0,
    attackSpeed: 4,
    combatStyle: "melee",
    targetDefLevel: 100,
    targetDefBonus: 0,
    targetHp: 150,
    ...overrides,
  };
}

describe("wiki spot-check — core constants", () => {
  it("melee/ranged effective level uses +8; magic uses +9", () => {
    expect(effectiveLevel(99, 1, 0, 8)).toBe(107);
    expect(effectiveLevel(99, 1, 3, 8)).toBe(110);
    expect(effectiveLevel(99, 1, 2, 9)).toBe(110); // magic accurate: +2 stance +9
    expect(effectiveLevel(99, 1.2, 0, 8)).toBe(126); // piety atk
  });

  it("max hit matches wiki trunc((eff*(b+64)+320)/640)", () => {
    expect(maxHit(107, 100)).toBe(Math.trunc((107 * 164 + 320) / 640));
    expect(maxHit(107, 100)).toBe(27);
  });

  it("normal hit chance matches wiki getNormalAccuracyRoll", () => {
    const atk = 18040;
    const def = 6976;
    const wiki = 1 - (def + 2) / (2 * (atk + 1));
    expect(hitChance(atk, def)).toBeCloseTo(wiki, 12);
  });

  it("fang hit chance matches wiki getFangAccuracyRoll (not 1-(1-p)²)", () => {
    const atk = 18040;
    const def = 6976;
    const wiki =
      1 - ((def + 2) * (2 * def + 3)) / (atk + 1) / (atk + 1) / 6;
    expect(fangHitChance(atk, def)).toBeCloseTo(wiki, 12);
    const independent = 1 - (1 - hitChance(atk, def)) ** 2;
    // Closed form differs from naive independent double-roll
    expect(Math.abs(fangHitChance(atk, def) - independent)).toBeGreaterThan(1e-6);
  });

  it("tbowScaling M=0/100/150/250 matches wiki relative bonuses", () => {
    expect(tbowScaling(100, 0, true)).toBe(40);
    expect(tbowScaling(100, 0, false)).toBe(54);
    expect(tbowScaling(100, 100, true)).toBe(93);
    expect(tbowScaling(100, 100, false)).toBe(131);
    expect(tbowScaling(100, 150, true)).toBe(114);
    expect(tbowScaling(100, 150, false)).toBe(164);
    expect(tbowScaling(100, 250, true)).toBe(140);
    expect(tbowScaling(100, 250, false)).toBe(215);
  });
});

describe("wiki spot-check — flagship calculateDps", () => {
  it("99 accurate melee +100/+100 vs def100/0", () => {
    const r = calculateDps(
      input({
        attackBonus: 100,
        strengthBonus: 100,
        stanceAttackBonus: 3,
        attackSpeed: 4,
      })
    );
    expect(r.maxHit).toBe(27);
    expect(r.attackRoll).toBe(110 * 164);
    expect(r.defenseRoll).toBe(109 * 64);
    expect(r.accuracy).toBeCloseTo(hitChance(r.attackRoll, r.defenseRoll), 12);
    expect(r.dps).toBeCloseTo((27 * r.accuracy) / (2 * 4 * 0.6), 10);
  });

  it("void melee accurate +100/+118", () => {
    const r = calculateDps(
      input({
        attackBonus: 100,
        strengthBonus: 118,
        stanceAttackBonus: 3,
        modifiers: [DPS_MODIFIERS.void_melee],
      })
    );
    // effAtk 110→121, effStr 107→117
    expect(r.attackRoll).toBe(121 * 164);
    expect(r.maxHit).toBe(maxHit(117, 118));
  });

  it("magic accurate uses +9 base (eff 110 with +2 stance)", () => {
    const r = calculateDps(
      input({
        combatStyle: "magic",
        attackBonus: 50,
        strengthBonus: 20,
        stanceAttackBonus: 2,
        spellBaseMaxHit: 24,
        attackSpeed: 5,
        targetMagicLevel: 80,
        targetDefBonus: 20,
      })
    );
    // eff magic = floor(99)+2+9 = 110
    expect(r.attackRoll).toBe(attackRoll(110, 50));
    expect(r.maxHit).toBe(Math.floor(24 * 1.2));
  });

  it("fang flagship vs mid def", () => {
    const r = calculateDps(
      input({
        attackBonus: 100,
        strengthBonus: 100,
        stanceAttackBonus: 3,
        weaponName: "Osmumten's fang",
        targetDefLevel: 150,
        targetDefBonus: 50,
      })
    );
    expect(r.attackShape).toBe("fang");
    expect(r.accuracy).toBeCloseTo(fangHitChance(r.attackRoll, r.defenseRoll), 12);
    const lo = Math.trunc(r.maxHit * 0.15);
    const hi = Math.trunc(r.maxHit * 0.85);
    expect(r.expectedHit).toBeCloseTo(r.accuracy * ((lo + hi) / 2), 10);
  });

  it("tbow vs magic-250 target applies trunc scaling", () => {
    const bare = calculateDps(
      input({
        combatStyle: "ranged",
        attackBonus: 100,
        strengthBonus: 80,
        attackSpeed: 5,
        targetDefLevel: 200,
        targetDefBonus: 100,
        targetMagicLevel: 250,
        targetHp: 750,
      })
    );
    const tbow = calculateDps(
      input({
        combatStyle: "ranged",
        attackBonus: 100,
        strengthBonus: 80,
        attackSpeed: 5,
        targetDefLevel: 200,
        targetDefBonus: 100,
        targetMagicLevel: 250,
        targetHp: 750,
        modifiers: [DPS_MODIFIERS.twisted_bow],
      })
    );
    expect(tbow.maxHit).toBe(tbowScaling(bare.maxHit, 250, false));
    expect(tbow.attackRoll).toBe(tbowScaling(bare.attackRoll, 250, true));
  });

  it("defence roll uses (def+9)*(bonus+64)", () => {
    expect(defenseRoll(214, 26)).toBe(223 * 90);
  });
});
