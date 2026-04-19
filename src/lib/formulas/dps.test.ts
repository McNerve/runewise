import { describe, it, expect } from "vitest";
import {
  effectiveLevel,
  maxHit,
  attackRoll,
  defenseRoll,
  hitChance,
  calculateDps,
  applyModifiers,
  DPS_MODIFIERS,
  dragonClawsExpectedDamage,
  calculateSpecDps,
} from "./dps";

describe("dps formulas", () => {
  describe("effectiveLevel", () => {
    it("computes correctly with no prayer or stance", () => {
      expect(effectiveLevel(99, 1.0, 0)).toBe(107);
    });

    it("applies prayer multiplier before floor", () => {
      // Piety: 1.2 attack
      expect(effectiveLevel(99, 1.2, 0)).toBe(126);
    });

    it("adds stance bonus after prayer", () => {
      // Accurate: +3
      expect(effectiveLevel(99, 1.0, 3)).toBe(110);
    });
  });

  describe("maxHit", () => {
    it("computes basic max hit", () => {
      const effStr = effectiveLevel(99, 1.0, 0); // 107
      // With +118 str bonus (typical melee)
      const mh = maxHit(effStr, 118);
      expect(mh).toBe(30);
    });

    it("returns 0 for very low stats", () => {
      const effStr = effectiveLevel(1, 1.0, 0); // 9
      expect(maxHit(effStr, 0)).toBe(1);
    });
  });

  describe("hitChance", () => {
    it("high accuracy when attack roll >> defense roll", () => {
      const acc = hitChance(50000, 10000);
      expect(acc).toBeGreaterThan(0.89);
    });

    it("low accuracy when defense roll >> attack roll", () => {
      const acc = hitChance(10000, 50000);
      expect(acc).toBeLessThan(0.1);
    });

    it("~50% when rolls are equal", () => {
      const acc = hitChance(20000, 20000);
      expect(acc).toBeCloseTo(0.5, 1);
    });
  });

  describe("attackRoll and defenseRoll", () => {
    it("attack roll = effAtk * (bonus + 64)", () => {
      expect(attackRoll(107, 100)).toBe(107 * 164);
    });

    it("defense roll = (defLevel + 9) * (defBonus + 64)", () => {
      expect(defenseRoll(214, 26)).toBe(223 * 90);
    });
  });

  describe("calculateDps", () => {
    it("produces reasonable DPS for max melee vs Vorkath", () => {
      const result = calculateDps({
        attackLevel: 99,
        strengthLevel: 99,
        rangedLevel: 99,
        magicLevel: 99,
        attackBonus: 132,
        strengthBonus: 118,
        prayerAttackMult: 1.2,
        prayerStrengthMult: 1.23,
        stanceAttackBonus: 0,
        stanceStrengthBonus: 3,
        attackSpeed: 4,
        combatStyle: "melee",
        targetDefLevel: 214,
        targetDefBonus: 26,
        targetHp: 750,
      });

      expect(result.maxHit).toBeGreaterThan(0);
      expect(result.accuracy).toBeGreaterThan(0);
      expect(result.accuracy).toBeLessThanOrEqual(1);
      expect(result.dps).toBeGreaterThan(0);
      expect(result.ttk).toBeGreaterThan(0);
      expect(result.attackRoll).toBeGreaterThan(0);
      expect(result.defenseRoll).toBeGreaterThan(0);
    });

    it("returns new attackRoll and defenseRoll fields", () => {
      const result = calculateDps({
        attackLevel: 99,
        strengthLevel: 99,
        rangedLevel: 99,
        magicLevel: 99,
        attackBonus: 100,
        strengthBonus: 100,
        prayerAttackMult: 1.0,
        prayerStrengthMult: 1.0,
        stanceAttackBonus: 0,
        stanceStrengthBonus: 0,
        attackSpeed: 4,
        combatStyle: "melee",
        targetDefLevel: 100,
        targetDefBonus: 50,
        targetHp: 200,
      });

      expect(result.attackRoll).toBe(attackRoll(107, 100));
      expect(result.defenseRoll).toBe(defenseRoll(100, 50));
    });
  });

  describe("applyModifiers", () => {
    it("applies slayer helm bonus", () => {
      const { accuracyMult, damageMult } = applyModifiers(
        1,
        1,
        "melee",
        [DPS_MODIFIERS.slayer_helm]
      );
      expect(accuracyMult).toBeCloseTo(7 / 6, 4);
      expect(damageMult).toBeCloseTo(7 / 6, 4);
    });

    it("applies void melee bonus", () => {
      const { accuracyMult, damageMult } = applyModifiers(
        1,
        1,
        "melee",
        [DPS_MODIFIERS.void_melee]
      );
      expect(accuracyMult).toBeCloseTo(1.10, 4);
      expect(damageMult).toBeCloseTo(1.10, 4);
    });

    it("ignores melee modifiers when using ranged", () => {
      const { accuracyMult, damageMult } = applyModifiers(
        1,
        1,
        "ranged",
        [DPS_MODIFIERS.void_melee]
      );
      expect(accuracyMult).toBe(1);
      expect(damageMult).toBe(1);
    });

    it("stacks multiple modifiers", () => {
      const { accuracyMult, damageMult } = applyModifiers(
        1,
        1,
        "melee",
        [DPS_MODIFIERS.slayer_helm, DPS_MODIFIERS.arclight]
      );
      expect(accuracyMult).toBeCloseTo((7 / 6) * 1.70, 4);
      expect(damageMult).toBeCloseTo((7 / 6) * 1.70, 4);
    });

    it("salve amulet applies to all styles", () => {
      for (const style of ["melee", "ranged", "magic"] as const) {
        const { accuracyMult } = applyModifiers(
          1,
          1,
          style,
          [DPS_MODIFIERS.salve_ei]
        );
        expect(accuracyMult).toBeCloseTo(1.20, 4);
      }
    });

    it("dhcb only applies to ranged", () => {
      const ranged = applyModifiers(1, 1, "ranged", [DPS_MODIFIERS.dhcb]);
      expect(ranged.accuracyMult).toBeCloseTo(1.30, 4);
      expect(ranged.damageMult).toBeCloseTo(1.25, 4);

      const melee = applyModifiers(1, 1, "melee", [DPS_MODIFIERS.dhcb]);
      expect(melee.accuracyMult).toBe(1);
    });

    it("tome of fire boosts magic damage by 50%", () => {
      const result = applyModifiers(1, 1, "magic", [DPS_MODIFIERS.tome_of_fire]);
      expect(result.damageMult).toBeCloseTo(1.50, 4);
      expect(result.accuracyMult).toBe(1.0);
    });
  });

  describe("calculateDps with modifiers", () => {
    const baseInput = {
      attackLevel: 99,
      strengthLevel: 99,
      rangedLevel: 99,
      magicLevel: 99,
      attackBonus: 100,
      strengthBonus: 100,
      prayerAttackMult: 1.0,
      prayerStrengthMult: 1.0,
      stanceAttackBonus: 0,
      stanceStrengthBonus: 0,
      attackSpeed: 4,
      combatStyle: "melee" as const,
      targetDefLevel: 100,
      targetDefBonus: 50,
      targetHp: 200,
    };

    it("slayer helm increases DPS", () => {
      const without = calculateDps(baseInput);
      const withMod = calculateDps({
        ...baseInput,
        modifiers: [DPS_MODIFIERS.slayer_helm],
      });

      expect(withMod.dps).toBeGreaterThan(without.dps);
      expect(withMod.maxHit).toBeGreaterThan(without.maxHit);
    });

    it("modifiers increase attack roll", () => {
      const without = calculateDps(baseInput);
      const withMod = calculateDps({
        ...baseInput,
        modifiers: [DPS_MODIFIERS.arclight],
      });

      expect(withMod.attackRoll).toBeGreaterThan(without.attackRoll);
    });
  });

  describe("dragonClawsExpectedDamage", () => {
    it("at 100% accuracy totals ~1.5× max hit", () => {
      const m = 48;
      const total = dragonClawsExpectedDamage(m, 1.0);
      expect(total).toBeGreaterThan(m * 1.4);
      expect(total).toBeLessThan(m * 1.6);
    });

    it("at 0% accuracy deals 1 damage", () => {
      expect(dragonClawsExpectedDamage(48, 0)).toBeCloseTo(1, 5);
    });

    it("monotonic in accuracy", () => {
      const m = 48;
      const low = dragonClawsExpectedDamage(m, 0.3);
      const mid = dragonClawsExpectedDamage(m, 0.6);
      const high = dragonClawsExpectedDamage(m, 0.9);
      expect(mid).toBeGreaterThan(low);
      expect(high).toBeGreaterThan(mid);
    });
  });

  describe("calculateSpecDps", () => {
    const baseInput = {
      attackLevel: 99, strengthLevel: 99, rangedLevel: 1, magicLevel: 1,
      attackBonus: 100, strengthBonus: 120,
      prayerAttackMult: 1.2, prayerStrengthMult: 1.23,
      stanceAttackBonus: 3, stanceStrengthBonus: 3,
      attackSpeed: 4, combatStyle: "melee" as const,
      targetDefLevel: 200, targetDefBonus: 50, targetHp: 500,
      specAccuracyMult: 1.0, specDamageMult: 1.0,
      specHits: 4, specGuaranteedHit: false, specSpeed: 4,
    };

    it("cascade path yields lower DPS than naive 4×hit at similar accuracy", () => {
      const cascade = calculateSpecDps({ ...baseInput, specCascadeType: "dragon_claws" });
      const naive = calculateSpecDps(baseInput);
      expect(cascade.specDps).toBeLessThan(naive.specDps);
    });
  });
});
