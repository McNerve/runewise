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
  applyMeleeGearPipeline,
  inferAttackShape,
  inferMonsterSize,
  isXericianMonster,
  isP2Wardens,
  chinchompaAccuracyNumer,
  tbowScaling,
  inferBoltEnchant,
  boltEnchantExpectedHit,
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

    it("void melee is a no-op in product mults (applied on effective levels)", () => {
      const { accuracyMult, damageMult } = applyModifiers(
        1,
        1,
        "melee",
        [DPS_MODIFIERS.void_melee]
      );
      expect(accuracyMult).toBe(1);
      expect(damageMult).toBe(1);
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

    it("tome of fire is +10% PvM (product mult); calculateDps gates on fire spells", () => {
      const result = applyModifiers(1, 1, "magic", [DPS_MODIFIERS.tome_of_fire]);
      expect(result.damageMult).toBeCloseTo(1.10, 4);
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

describe("twisted bow scaling (wiki tbowScaling)", () => {
  // Port of weirdgloop PlayerVsNPCCalc.tbowScaling:
  // bonus = clamp(base + trunc((3M-f)/100) - trunc((trunc(3M/10)-10f)^2/100))
  // scale = bonus/100  (applied as trunc(current * bonus / 100))
  // Acc base/clamp 140 f=10; dmg base/clamp 250 f=14.
  it("M=0 → weak scale (low magic targets are bad for tbow)", () => {
    const m0 = applyModifiers(1, 1, "ranged", [DPS_MODIFIERS.twisted_bow], 0);
    // acc bonus 40 → 0.40×; dmg bonus 54 → 0.54×
    expect(m0.accuracyMult).toBeCloseTo(0.4, 5);
    expect(m0.damageMult).toBeCloseTo(0.54, 5);
  });

  it("M=100 → ~0.93× acc / ~1.31× dmg", () => {
    const m100 = applyModifiers(1, 1, "ranged", [DPS_MODIFIERS.twisted_bow], 100);
    expect(m100.accuracyMult).toBeCloseTo(0.93, 5);
    expect(m100.damageMult).toBeCloseTo(1.31, 5);
  });

  it("M=150 → ~1.14× acc / ~1.64× dmg", () => {
    const m150 = applyModifiers(1, 1, "ranged", [DPS_MODIFIERS.twisted_bow], 150);
    expect(m150.accuracyMult).toBeCloseTo(1.14, 5);
    expect(m150.damageMult).toBeCloseTo(1.64, 5);
  });

  it("M=250 → 1.40× acc / 2.15× dmg (high magic is best)", () => {
    const m250 = applyModifiers(1, 1, "ranged", [DPS_MODIFIERS.twisted_bow], 250);
    expect(m250.accuracyMult).toBeCloseTo(1.4, 5);
    expect(m250.damageMult).toBeCloseTo(2.15, 5);
  });

  it("accuracy and damage both increase from M=100 to M=250 (not inverted)", () => {
    const low = applyModifiers(1, 1, "ranged", [DPS_MODIFIERS.twisted_bow], 100);
    const high = applyModifiers(1, 1, "ranged", [DPS_MODIFIERS.twisted_bow], 250);
    expect(high.accuracyMult).toBeGreaterThan(low.accuracyMult);
    expect(high.damageMult).toBeGreaterThan(low.damageMult);
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

describe("twisted bow Xerician magic clamp", () => {
  it("clamps target magic at 250 outside CoX and 350 for Xerician", () => {
    const outside = applyModifiers(1, 1, "ranged", [DPS_MODIFIERS.twisted_bow], 350);
    const at250 = applyModifiers(1, 1, "ranged", [DPS_MODIFIERS.twisted_bow], 250);
    // Non-Xerician: magic 350 clamps to 250 → identical.
    expect(outside.damageMult).toBeCloseTo(at250.damageMult, 5);
    expect(outside.accuracyMult).toBeCloseTo(at250.accuracyMult, 5);

    // Xerician cap 350: still uses full magic (wiki still high at 350).
    const inCox = applyModifiers(1, 1, "ranged", [DPS_MODIFIERS.twisted_bow], 350, 350);
    // Mag 350 acc: still near clamp 140 → 1.40; dmg lower than peak but >1.
    expect(inCox.accuracyMult).toBeCloseTo(1.4, 5);
    expect(inCox.damageMult).toBeGreaterThan(1);
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

  it("uses 4× gear mult inside ToA", () => {
    const r = calculateDps({
      ...shadowInput,
      modifiers: [DPS_MODIFIERS.tumekens_shadow],
      inToA: true,
    });
    // gear atk 173*4+64 = 756; roll = 110*756 = 83160
    expect(r.attackRoll).toBe(110 * (173 * 4 + 64));
    // gear dmg min(25*4, 100)=100 → floor(34*2.0)=68
    expect(r.maxHit).toBe(68);
  });

  it("caps tripled gear magic damage contribution at 100%", () => {
    const r = calculateDps({
      ...shadowInput,
      strengthBonus: 40, // 40*3=120 → cap 100
      modifiers: [DPS_MODIFIERS.tumekens_shadow],
    });
    expect(r.maxHit).toBe(Math.floor(34 * (1 + 100 / 100))); // 68
  });
});

describe("void melee as effective-level factor", () => {
  it("piety + void: trunc(eff * 11/10) before max hit / roll", () => {
    // str 99, piety 1.23, aggressive +3 → effStr = floor(99*1.23)+3+8 = 132
    // void: trunc(132*11/10)=145
    // maxHit +100 str: floor(0.5 + 145*164/640) = floor(0.5+37.15625)=37
    // atk 99, piety 1.2, accurate +3 → effAtk=129; void 141; roll=141*164
    const r = calculateDps(
      meleeInput({
        prayerAttackMult: 1.2,
        prayerStrengthMult: 1.23,
        stanceAttackBonus: 3,
        stanceStrengthBonus: 3,
        attackBonus: 100,
        strengthBonus: 100,
        modifiers: [DPS_MODIFIERS.void_melee],
      })
    );
    expect(r.maxHit).toBe(37);
    expect(r.attackRoll).toBe(141 * 164);
  });

  it("differs from post-product floor(maxHit * 1.1) on some bonuses", () => {
    // Without void maxHit = floor(0.5 + 132*164/640)=34; floor(34*1.1)=37 — same here,
    // but attack roll: floor(129*164*1.1)=23281 vs 141*164=23124 — differs.
    const productStyle = Math.floor(129 * 164 * 1.1);
    const r = calculateDps(
      meleeInput({
        prayerAttackMult: 1.2,
        prayerStrengthMult: 1.23,
        stanceAttackBonus: 3,
        stanceStrengthBonus: 3,
        attackBonus: 100,
        strengthBonus: 100,
        modifiers: [DPS_MODIFIERS.void_melee],
      })
    );
    expect(r.attackRoll).not.toBe(productStyle);
    expect(r.attackRoll).toBe(141 * 164);
  });
});

describe("tome of fire PvM fire-spell gate", () => {
  it("applies +10% on fire spells", () => {
    const base = calculateDps(
      meleeInput({
        combatStyle: "magic",
        spellBaseMaxHit: 20,
        strengthBonus: 0,
        attackBonus: 0,
        targetMagicLevel: 1,
      })
    );
    const tome = calculateDps(
      meleeInput({
        combatStyle: "magic",
        spellBaseMaxHit: 20,
        strengthBonus: 0,
        attackBonus: 0,
        targetMagicLevel: 1,
        spellElement: "fire",
        modifiers: [DPS_MODIFIERS.tome_of_fire],
      })
    );
    expect(base.maxHit).toBe(20);
    expect(tome.maxHit).toBe(22); // trunc(20 * 11/10)
  });

  it("does not apply on water spells", () => {
    const tome = calculateDps(
      meleeInput({
        combatStyle: "magic",
        spellBaseMaxHit: 20,
        strengthBonus: 0,
        attackBonus: 0,
        targetMagicLevel: 1,
        spellElement: "water",
        modifiers: [DPS_MODIFIERS.tome_of_fire],
      })
    );
    expect(tome.maxHit).toBe(20);
  });
});

describe("elite void magic +5% and prayer magic damage", () => {
  it("elite void adds +5% primary magic damage", () => {
    const r = calculateDps(
      meleeInput({
        combatStyle: "magic",
        spellBaseMaxHit: 40,
        strengthBonus: 0,
        attackBonus: 0,
        targetMagicLevel: 1,
        modifiers: [DPS_MODIFIERS.elite_void_magic],
      })
    );
    // floor(40 * 1.05) = 42; accuracy also gets void level factor
    expect(r.maxHit).toBe(42);
  });

  it("Augury +4% magic damage stacks in primary stage", () => {
    const r = calculateDps(
      meleeInput({
        combatStyle: "magic",
        spellBaseMaxHit: 40,
        strengthBonus: 10,
        attackBonus: 0,
        targetMagicLevel: 1,
        prayerMagicDamagePct: 4,
      })
    );
    // floor(40 * (1 + 14/100)) = floor(45.6) = 45
    expect(r.maxHit).toBe(45);
  });
});

describe("melee ordered trunc pipeline", () => {
  it("salve then arclight uses sequential trunc (not pure product)", () => {
    const r = calculateDps(
      meleeInput({
        modifiers: [DPS_MODIFIERS.salve_ei, DPS_MODIFIERS.arclight],
      })
    );
    // base max = floor(0.5 + 107*164/640) = 27
    // salve 6/5: trunc(27*6/5)=32
    // arclight add 70%: 32 + trunc(32*70/100)=32+22=54
    expect(r.maxHit).toBe(54);
    // base roll 107*164=17548
    // salve: trunc(17548*6/5)=21057
    // arclight: 21057 + trunc(21057*70/100)=21057+14739=35796
    expect(r.attackRoll).toBe(35796);
  });

  it("obsidian adds trunc(base/10) not product 1.10", () => {
    const r = calculateDps(
      meleeInput({
        modifiers: [DPS_MODIFIERS.obsidian],
      })
    );
    // base max 27 → 27 + trunc(27/10)=29
    expect(r.maxHit).toBe(29);
    // base roll 17548 → 17548 + trunc(17548/10)=19292
    expect(r.attackRoll).toBe(17548 + Math.trunc(17548 / 10));
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

describe("deferred wiki parity — fang/scythe/arclight/crystal/magic", () => {
  it("infers fang and scythe shapes from weapon names", () => {
    expect(inferAttackShape("Osmumten's fang")).toBe("fang");
    expect(inferAttackShape("Scythe of vitur")).toBe("scythe");
    expect(inferAttackShape("Abyssal whip")).toBe("standard");
  });

  it("infers monster sizes and Xerician/P2 wardens flags", () => {
    expect(inferMonsterSize("Corporeal Beast")).toBe(3);
    expect(inferMonsterSize("Goblin")).toBe(1);
    expect(isXericianMonster("Great Olm")).toBe(true);
    expect(isXericianMonster("Zebak")).toBe(false);
    expect(isP2Wardens("Warden (P2)")).toBe(true);
  });

  it("fang double-rolls accuracy (same mid-band EV as uniform at equal acc)", () => {
    const base = meleeInput({
      weaponName: "Osmumten's fang",
      attackBonus: 100,
      strengthBonus: 100,
      targetDefLevel: 100,
      targetDefBonus: 0,
    });
    const fang = calculateDps(base);
    const plain = calculateDps({ ...base, weaponName: "Abyssal whip", attackShape: "standard" });
    // Same gear max hit, but fang effective accuracy is higher → higher EV
    expect(fang.accuracy).toBeGreaterThan(plain.accuracy);
    expect(fang.attackShape).toBe("fang");
    expect(fang.maxHit).toBe(plain.maxHit);
    expect(fang.expectedHit).toBeGreaterThan(plain.expectedHit);
    expect(fang.dps).toBeGreaterThan(plain.dps);
  });

  it("scythe size-3 deals more expected damage than size-1", () => {
    const base = meleeInput({
      weaponName: "Scythe of vitur",
      attackBonus: 80,
      strengthBonus: 75,
      attackSpeed: 5,
      targetDefLevel: 50,
      targetDefBonus: 0,
    });
    const s1 = calculateDps({ ...base, monsterSize: 1 });
    const s3 = calculateDps({ ...base, monsterSize: 3 });
    expect(s3.expectedHit).toBeGreaterThan(s1.expectedHit);
    expect(s3.dps).toBeGreaterThan(s1.dps);
  });

  it("arclight scales with demonbane vulnerability", () => {
    const mods = [DPS_MODIFIERS.arclight];
    const at100 = applyMeleeGearPipeline(10000, 40, mods, { demonbaneVulnerability: 100 });
    const at70 = applyMeleeGearPipeline(10000, 40, mods, { demonbaneVulnerability: 70 });
    // percent 70 vs 49 → less boost at lower vuln
    expect(at100.attackRoll).toBeGreaterThan(at70.attackRoll);
    expect(at100.maxHit).toBeGreaterThan(at70.maxHit);
  });

  it("crystal pieces scale accuracy and damage", () => {
    const full = calculateDps({
      ...meleeInput({ combatStyle: "ranged", rangedLevel: 99, attackBonus: 100, strengthBonus: 80, attackSpeed: 4 }),
      combatStyle: "ranged",
      modifiers: [DPS_MODIFIERS.crystal_armour],
      crystalPieces: 6,
    });
    const helmOnly = calculateDps({
      ...meleeInput({ combatStyle: "ranged", rangedLevel: 99, attackBonus: 100, strengthBonus: 80, attackSpeed: 4 }),
      combatStyle: "ranged",
      modifiers: [DPS_MODIFIERS.crystal_armour],
      crystalPieces: 1,
    });
    expect(full.maxHit).toBeGreaterThan(helmOnly.maxHit);
    expect(full.attackRoll).toBeGreaterThan(helmOnly.attackRoll);
  });

  it("P2 wardens double-applies tbow accuracy scaling", () => {
    const base = {
      attackLevel: 99, strengthLevel: 99, rangedLevel: 99, magicLevel: 99,
      attackBonus: 100, strengthBonus: 80,
      prayerAttackMult: 1, prayerStrengthMult: 1,
      stanceAttackBonus: 0, stanceStrengthBonus: 0,
      attackSpeed: 5, combatStyle: "ranged" as const,
      targetDefLevel: 200, targetDefBonus: 100, targetHp: 500,
      targetMagicLevel: 200,
      modifiers: [DPS_MODIFIERS.twisted_bow],
    };
    const normal = calculateDps(base);
    const p2 = calculateDps({ ...base, p2Wardens: true });
    expect(p2.attackRoll).not.toBe(normal.attackRoll);
    // Second apply on already-scaled roll typically changes the value
    expect(p2.maxHit).toBe(normal.maxHit); // dmg not double-applied
  });

  it("chaos gauntlets add +3 base on bolt spells; charge +10 on god spells", () => {
    const bolt = calculateDps({
      ...meleeInput({ combatStyle: "magic", magicLevel: 99, attackBonus: 50, strengthBonus: 20 }),
      combatStyle: "magic",
      spellBaseMaxHit: 12,
      isBoltSpell: true,
      chaosGauntlets: true,
    });
    const boltNo = calculateDps({
      ...meleeInput({ combatStyle: "magic", magicLevel: 99, attackBonus: 50, strengthBonus: 20 }),
      combatStyle: "magic",
      spellBaseMaxHit: 12,
      isBoltSpell: true,
    });
    expect(bolt.maxHit).toBeGreaterThan(boltNo.maxHit);

    const god = calculateDps({
      ...meleeInput({ combatStyle: "magic", magicLevel: 99, attackBonus: 50, strengthBonus: 20 }),
      combatStyle: "magic",
      spellBaseMaxHit: 20,
      isGodSpell: true,
      chargeActive: true,
    });
    const godNo = calculateDps({
      ...meleeInput({ combatStyle: "magic", magicLevel: 99, attackBonus: 50, strengthBonus: 20 }),
      combatStyle: "magic",
      spellBaseMaxHit: 20,
      isGodSpell: true,
    });
    expect(god.maxHit).toBeGreaterThan(godNo.maxHit);
  });

  it("smoke staff boosts magic attack roll", () => {
    const withSmoke = calculateDps({
      ...meleeInput({ combatStyle: "magic", magicLevel: 99, attackBonus: 50, strengthBonus: 10 }),
      combatStyle: "magic",
      spellBaseMaxHit: 20,
      smokeStaff: true,
    });
    const noSmoke = calculateDps({
      ...meleeInput({ combatStyle: "magic", magicLevel: 99, attackBonus: 50, strengthBonus: 10 }),
      combatStyle: "magic",
      spellBaseMaxHit: 20,
    });
    expect(withSmoke.attackRoll).toBeGreaterThan(noSmoke.attackRoll);
  });

  it("elemental weakness adds to magic accuracy roll", () => {
    const weak = calculateDps({
      ...meleeInput({ combatStyle: "magic", magicLevel: 99, attackBonus: 40, strengthBonus: 10 }),
      combatStyle: "magic",
      spellBaseMaxHit: 24,
      spellElement: "fire",
      elementalWeaknessElement: "fire",
      elementalWeaknessSeverity: 50,
    });
    const plain = calculateDps({
      ...meleeInput({ combatStyle: "magic", magicLevel: 99, attackBonus: 40, strengthBonus: 10 }),
      combatStyle: "magic",
      spellBaseMaxHit: 24,
      spellElement: "fire",
    });
    expect(weak.attackRoll).toBeGreaterThan(plain.attackRoll);
  });

  it("BGS-style absolute def drain stacks after DWH %", () => {
    const dwhOnly = calculateDps(meleeInput({ defReductions: 1, targetDefLevel: 100 }));
    const both = calculateDps(meleeInput({ defReductions: 1, defLevelDrain: 20, targetDefLevel: 100 }));
    expect(both.defenseRoll).toBeLessThan(dwhOnly.defenseRoll);
  });

  it("chinchompa fuse numerators match wiki table", () => {
    expect(chinchompaAccuracyNumer(1, "short")).toBe(4);
    expect(chinchompaAccuracyNumer(7, "short")).toBe(2);
    expect(chinchompaAccuracyNumer(5, "medium")).toBe(4);
    expect(chinchompaAccuracyNumer(2, "long")).toBe(2);
  });

  it("spec DPS uses specWeaponSpeed not loadout speed", () => {
    const slowLoadout = calculateSpecDps({
      ...meleeInput({ attackSpeed: 7 }),
      specAccuracyMult: 1,
      specDamageMult: 1,
      specHits: 1,
      specGuaranteedHit: false,
      specSpeed: 7,
      specWeaponSpeed: 4,
    });
    const sameSpeed = calculateSpecDps({
      ...meleeInput({ attackSpeed: 7 }),
      specAccuracyMult: 1,
      specDamageMult: 1,
      specHits: 1,
      specGuaranteedHit: false,
      specSpeed: 7,
      specWeaponSpeed: 7,
    });
    expect(slowLoadout.specDps).toBeGreaterThan(sameSpeed.specDps);
  });

  it("tbowScaling is pure trunc factor", () => {
    expect(tbowScaling(10000, 250, true)).toBe(14000);
  });
});

describe("bolt enchant and ZCB", () => {
  it("infers bolt enchant from ammo names", () => {
    expect(inferBoltEnchant("Diamond bolts (e)")).toBe("diamond");
    expect(inferBoltEnchant("Ruby dragon bolts (e)")).toBe("ruby");
    expect(inferBoltEnchant("Rune arrow")).toBe("none");
  });

  it("diamond bolts raise EV vs plain accuracy mid-band", () => {
    const plain = boltEnchantExpectedHit({
      enchant: "none", maxHit: 40, accuracy: 0.5, targetHp: 200, rangedLevel: 99,
    });
    const diamond = boltEnchantExpectedHit({
      enchant: "diamond", maxHit: 40, accuracy: 0.5, targetHp: 200, rangedLevel: 99,
    });
    expect(diamond).toBeGreaterThan(plain);
  });

  it("ruby proc uses 20% HP cap 100", () => {
    const r = boltEnchantExpectedHit({
      enchant: "ruby", maxHit: 5, accuracy: 0, targetHp: 1000, rangedLevel: 99, guaranteedProc: true,
    });
    expect(r).toBe(100);
  });

  it("ZCB special sets accuracy 1 and uses guaranteed bolt proc in calculateDps", () => {
    const base = {
      attackLevel: 99, strengthLevel: 99, rangedLevel: 99, magicLevel: 99,
      attackBonus: 100, strengthBonus: 80,
      prayerAttackMult: 1, prayerStrengthMult: 1,
      stanceAttackBonus: 0, stanceStrengthBonus: 0,
      attackSpeed: 5, combatStyle: "ranged" as const,
      targetDefLevel: 300, targetDefBonus: 200, targetHp: 400,
      boltEnchant: "diamond" as const,
    };
    const normal = calculateDps(base);
    const zcb = calculateDps({ ...base, zcbSpec: true });
    expect(zcb.accuracy).toBe(1);
    expect(zcb.dps).toBeGreaterThan(normal.dps);
  });
});
