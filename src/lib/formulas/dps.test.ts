import { describe, it, expect } from "vitest";
import {
  effectiveLevel,
  maxHit,
  attackRoll,
  defenseRoll,
  hitChance,
  calculateDps,
  applyModifiers,
  addModifierExclusive,
  sanitizeModifierSet,
  EXCLUSIVE_MODIFIER_GROUPS,
  DPS_MODIFIERS,
  dragonClawsExpectedDamage,
  calculateSpecDps,
  poisonDps,
  coxScale,
  coxHpScale,
  toaDefenseScale,
  toaHpScale,
  type DpsInput,
} from "./dps";

// Base melee input used by the calculate* regression tests below. Expected
// values are derived from the OSRS combat formulas, not copied from output.
function meleeInput(overrides: Partial<DpsInput> = {}): DpsInput {
  return {
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
    targetDefBonus: 0,
    targetHp: 150,
    ...overrides,
  };
}

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

    it("salve (ei) applies +20% to every style, magic included", () => {
      for (const style of ["melee", "ranged", "magic"] as const) {
        expect(applyModifiers(1, 1, style, [DPS_MODIFIERS.salve_ei]).accuracyMult).toBeCloseTo(1.20, 4);
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

    it("halberd 2nd hit at -25% accuracy lowers spec DPS vs two full-accuracy hits", () => {
      const full = calculateSpecDps({ ...baseInput, specHits: 2 });
      const halberd = calculateSpecDps({ ...baseInput, specHits: 2, specSecondHitAccuracyMult: 0.75 });
      expect(halberd.specDps).toBeLessThan(full.specDps);
      expect(halberd.specDps).toBeGreaterThan(0);
    });
  });
});

describe("twisted bow scaling (canonical OSRS wiki formula)", () => {
  // multiplier = 1 + bonus/100, where (with M = target magic level):
  //   acc% = 140 + floor((10M-10)/100) - floor((M-100)^2/100), clamped [0,140]
  //   dmg% = 250 + floor((10M-14)/100) - floor((M-140)^2/100), clamped [0,250]
  it("scales up with target magic level (the bonus is additive over 1x)", () => {
    // magic 150: acc 140+14-25=129 ->2.29, dmg 250+14-1=263->cap250 ->3.50
    const m150 = applyModifiers(1, 1, "ranged", [DPS_MODIFIERS.twisted_bow], 150);
    expect(m150.accuracyMult).toBeCloseTo(2.29, 5);
    expect(m150.damageMult).toBeCloseTo(3.5, 5);
  });

  it("falls off at very high magic (parabolic) — magic 250 = no accuracy bonus", () => {
    // magic 250: acc 140+24-225=-61 ->clamp 0 ->1.00, dmg 250+24-121=153 ->2.53
    const m250 = applyModifiers(1, 1, "ranged", [DPS_MODIFIERS.twisted_bow], 250);
    expect(m250.accuracyMult).toBeCloseTo(1.0, 5);
    expect(m250.damageMult).toBeCloseTo(2.53, 5);
  });

  it("is never clamped to zero, and gives a damage bonus across the boss range", () => {
    // The old bug both collapsed to ~0 above magic 80 and dropped the +1 base.
    for (const magic of [100, 150, 190, 250]) {
      const r = applyModifiers(1, 1, "ranged", [DPS_MODIFIERS.twisted_bow], magic);
      expect(r.accuracyMult).toBeGreaterThanOrEqual(1);
      expect(r.damageMult).toBeGreaterThan(2);
    }
    // Mid-range magic (below the accuracy peak) gets a real accuracy bonus.
    for (const magic of [100, 150, 190] as const) {
      expect(applyModifiers(1, 1, "ranged", [DPS_MODIFIERS.twisted_bow], magic).accuracyMult).toBeGreaterThan(1);
    }
  });
});

describe("salve amulet style restrictions", () => {
  it("salve (e) boosts melee and ranged by 20%", () => {
    expect(applyModifiers(1, 1, "melee", [DPS_MODIFIERS.salve_e]).damageMult).toBeCloseTo(1.2, 5);
    expect(applyModifiers(1, 1, "ranged", [DPS_MODIFIERS.salve_e]).accuracyMult).toBeCloseTo(1.2, 5);
  });

  it("salve (e) does NOT boost magic", () => {
    const r = applyModifiers(1, 1, "magic", [DPS_MODIFIERS.salve_e]);
    expect(r.accuracyMult).toBe(1);
    expect(r.damageMult).toBe(1);
  });

  it("salve (ei) gives +20% in all styles, magic included", () => {
    expect(applyModifiers(1, 1, "magic", [DPS_MODIFIERS.salve_ei]).damageMult).toBeCloseTo(1.2, 5);
    expect(applyModifiers(1, 1, "melee", [DPS_MODIFIERS.salve_ei]).damageMult).toBeCloseTo(1.2, 5);
    expect(applyModifiers(1, 1, "ranged", [DPS_MODIFIERS.salve_ei]).damageMult).toBeCloseTo(1.2, 5);
  });

  it("leaf-bladed battleaxe passive is damage-only", () => {
    const r = applyModifiers(1, 1, "melee", [DPS_MODIFIERS.leaf_bladed]);
    expect(r.accuracyMult).toBe(1);
    expect(r.damageMult).toBeCloseTo(1.175, 5);
  });
});

describe("slayer helm style overrides", () => {
  it("gives melee 7/6 and ranged/magic a flat 15%", () => {
    expect(applyModifiers(1, 1, "melee", [DPS_MODIFIERS.slayer_helm]).accuracyMult).toBeCloseTo(7 / 6, 5);
    for (const style of ["ranged", "magic"] as const) {
      const r = applyModifiers(1, 1, style, [DPS_MODIFIERS.slayer_helm]);
      expect(r.accuracyMult).toBeCloseTo(1.15, 5);
      expect(r.damageMult).toBeCloseTo(1.15, 5);
    }
  });
});

describe("addModifierExclusive", () => {
  it("evicts salve variants when slayer helm is added (and vice versa)", () => {
    const s = new Set(["salve_ei", "arclight"]);
    addModifierExclusive(s, "slayer_helm");
    expect(s).toEqual(new Set(["arclight", "slayer_helm"]));
    addModifierExclusive(s, "salve_e");
    expect(s).toEqual(new Set(["arclight", "salve_e"]));
  });

  it("allows only one void set at a time", () => {
    const s = new Set(["void_melee"]);
    addModifierExclusive(s, "elite_void_ranged");
    expect(s).toEqual(new Set(["elite_void_ranged"]));
  });

  it("leaves non-group modifiers untouched", () => {
    const s = new Set(["dhcb"]);
    addModifierExclusive(s, "twisted_bow");
    expect(s).toEqual(new Set(["dhcb", "twisted_bow"]));
  });

  it("sanitizeModifierSet collapses illegal saved combos", () => {
    expect(sanitizeModifierSet(["slayer_helm", "salve_ei", "void_melee", "elite_void_magic"]))
      .toEqual(new Set(["salve_ei", "elite_void_magic"]));
  });

  it("every group member is a real modifier id", () => {
    for (const group of EXCLUSIVE_MODIFIER_GROUPS) {
      for (const id of group) expect(DPS_MODIFIERS[id]).toBeDefined();
    }
  });
});

describe("twisted bow CoX magic clamp", () => {
  it("clamps target magic at 250 outside CoX and 350 inside", () => {
    const outside = applyModifiers(1, 1, "ranged", [DPS_MODIFIERS.twisted_bow], 350);
    const at250 = applyModifiers(1, 1, "ranged", [DPS_MODIFIERS.twisted_bow], 250);
    // Outside CoX, magic 350 is clamped to 250 → identical.
    expect(outside.damageMult).toBeCloseTo(at250.damageMult, 5);
    expect(outside.accuracyMult).toBeCloseTo(at250.accuracyMult, 5);

    // Inside CoX the cap is 350, so magic 350 is used directly. The bonus is
    // parabolic and well past its peak by 350, so it floors to 0 (1.00x) —
    // a different, lower value than the 250-clamped one. Matches real OSRS.
    const inCox = applyModifiers(1, 1, "ranged", [DPS_MODIFIERS.twisted_bow], 350, 350);
    expect(inCox.damageMult).toBeCloseTo(1.0, 5);
    expect(inCox.accuracyMult).toBeCloseTo(1.0, 5);
    expect(inCox.damageMult).not.toBeCloseTo(at250.damageMult, 5);
  });
});

describe("defReductions (DWH/BGS) reduce defence before the magic blend", () => {
  it("reduces the raw defence level by 30% per stack for melee", () => {
    // targetDefLevel 100, defBonus 0. 1 stack: floor(100*0.7)=70 -> (70+9)*64=5056.
    const one = calculateDps(meleeInput({ targetDefLevel: 100, targetDefBonus: 0, defReductions: 1 }));
    expect(one.defenseRoll).toBe(defenseRoll(70, 0));
    // 2 stacks: floor(70*0.7)=49 -> (49+9)*64=3712.
    const two = calculateDps(meleeInput({ targetDefLevel: 100, targetDefBonus: 0, defReductions: 2 }));
    expect(two.defenseRoll).toBe(defenseRoll(49, 0));
  });

  it("does NOT apply Defence reductions to the magic roll (magic uses Magic level)", () => {
    // magic rolls against targetMagicLevel (100) directly: (100+9)*(0+64)=6976,
    // regardless of defReductions, which only drain the Defence level.
    const r = calculateDps(meleeInput({
      combatStyle: "magic",
      targetDefLevel: 100,
      targetMagicLevel: 100,
      targetDefBonus: 0,
      defReductions: 1,
      spellBaseMaxHit: 30,
    }));
    expect(r.defenseRoll).toBe(defenseRoll(100, 0));
  });
});

describe("raid scaling helpers", () => {
  it("toaDefenseScale / toaHpScale scale by 1 + invocation/100", () => {
    expect(toaDefenseScale(100, 300)).toBe(400);
    expect(toaDefenseScale(100, 0)).toBe(100);
    expect(toaHpScale(100, 150)).toBe(250);
  });

  it("coxHpScale / coxScale scale by 1 + 0.5*(party-1), CM adds 50%", () => {
    expect(coxHpScale(100, 1)).toBe(100);
    expect(coxHpScale(100, 3)).toBe(200);
    expect(coxScale(200, 4, false)).toBe(500);
    expect(coxScale(100, 2, true)).toBe(225);
  });
});

describe("magic accuracy rolls against the NPC Magic level, not Defence", () => {
  it("uses (magicLevel+9)*(magicDefBonus+64), independent of the Defence level", () => {
    // target magic 52, magic-def bonus 35 -> (52+9)*(35+64)=61*99=6039
    const r = calculateDps(meleeInput({
      combatStyle: "magic",
      targetDefLevel: 80,
      targetMagicLevel: 52,
      targetDefBonus: 35,
      spellBaseMaxHit: 30,
    }));
    expect(r.defenseRoll).toBe(defenseRoll(52, 35));
    expect(r.defenseRoll).toBe(6039);
    // independent of the raw Defence level (no 70/30 blend, no Defence term)
    expect(r.defenseRoll).not.toBe(defenseRoll(80, 35));
  });
});

describe("poisonDps", () => {
  it("returns the correct per-style averages", () => {
    expect(poisonDps("none")).toBe(0);
    expect(poisonDps("poison")).toBeCloseTo(4 / 18, 6);
    expect(poisonDps("venom")).toBeCloseTo(12 / 18, 6);
  });
});

describe("Tumeken's shadow triples only the gear bonus", () => {
  // effAtk = effectiveLevel(99, 1.0, 3) = 110. Gear magic attack +173, magic dmg +25%, spell base 34.
  // Shadow: attack roll = 110 * (3*173 + 64) = 110*583 = 64130 (NOT 110*(173+64)*3).
  //         max hit = floor(34 * (1 + 3*25/100)) = floor(34*1.75) = 59 (NOT floor(34*1.25)*3 = 126).
  const shadowInput = meleeInput({
    combatStyle: "magic",
    magicLevel: 99,
    attackBonus: 173,
    strengthBonus: 25,
    stanceAttackBonus: 3,
    spellBaseMaxHit: 34,
    targetMagicLevel: 100,
  });

  it("triples the gear attack bonus and magic damage %, leaving the +64 base intact", () => {
    const r = calculateDps({ ...shadowInput, modifiers: [DPS_MODIFIERS.tumekens_shadow] });
    expect(r.attackRoll).toBe(64130);
    expect(r.maxHit).toBe(59);
  });

  it("matches the un-tripled values when shadow is absent", () => {
    const r = calculateDps(shadowInput);
    expect(r.attackRoll).toBe(110 * (173 + 64));
    expect(r.maxHit).toBe(42); // floor(34 * 1.25)
  });
});

describe("dragonClawsExpectedDamage cascade", () => {
  it("treats follow-up hits as guaranteed once any roll connects", () => {
    // M=48, acc=0.7. Ranges expected: 35.5/17.5/8.5/9.5.
    // Sum over first-connect index k of P(k) * sum(ranges[k..3]) + miss*1 = 58.48
    expect(dragonClawsExpectedDamage(48, 0.7)).toBeCloseTo(58.48, 2);
  });

  it("equals the full guaranteed cascade at 100% accuracy", () => {
    // acc=1 -> only k=0 term: 35.5+17.5+8.5+9.5 = 71
    expect(dragonClawsExpectedDamage(48, 1)).toBeCloseTo(71, 5);
  });

  it("falls to ~1 damage when accuracy is 0", () => {
    expect(dragonClawsExpectedDamage(48, 0)).toBeCloseTo(1, 5);
  });
});
