/**
 * Flagship DPS fixtures locked for wiki-parity regressions.
 *
 * Expected numbers are computed by our pure formulas after aligning to
 * weirdgloop/osrs-dps-calc rules (effective-level void, tbowScaling, fang band,
 * ordered melee truncs). When intentionally changing formulas, update these
 * fixtures and note the wiki behaviour in the commit message.
 *
 * Manual spot-check target: https://tools.runescape.wiki/osrs-dps/
 */
import { describe, it, expect } from "vitest";
import {
  calculateDps,
  DPS_MODIFIERS,
  tbowScaling,
  fangHitChance,
  hitChance,
  type DpsInput,
} from "./dps";
import { fangExpectedHit } from "./hitDistribution";
import { lookupMonsterMeta } from "../data/monster-attributes";

function base(overrides: Partial<DpsInput> = {}): DpsInput {
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
    targetHp: 100,
    ...overrides,
  };
}

describe("wiki flagship fixtures", () => {
  it("void melee applies on effective levels (not post product)", () => {
    // Accurate +3 atk only: effAtk = 110 → void trunc*11/10 = 121
    // effStr = 107 → void 117; max = floor(0.5 + 117*182/640) = 33
    const r = calculateDps(
      base({
        attackBonus: 100,
        strengthBonus: 118,
        stanceAttackBonus: 3,
        modifiers: [DPS_MODIFIERS.void_melee],
      })
    );
    expect(r.maxHit).toBe(33);
    expect(r.attackRoll).toBe(121 * (100 + 64));
  });

  it("tbow at magic 250 scales roll and max via trunc formula", () => {
    const ar = 20000;
    const mh = 50;
    expect(tbowScaling(ar, 250, true)).toBe(Math.trunc((ar * 140) / 100));
    expect(tbowScaling(mh, 250, false)).toBe(Math.trunc((mh * 215) / 100));

    const r = calculateDps(
      base({
        combatStyle: "ranged",
        attackBonus: 100,
        strengthBonus: 80,
        attackSpeed: 5,
        targetDefLevel: 200,
        targetDefBonus: 100,
        targetHp: 750,
        targetMagicLevel: 250,
        modifiers: [DPS_MODIFIERS.twisted_bow],
      })
    );
    expect(r.maxHit).toBeGreaterThan(40);
    expect(r.accuracy).toBeGreaterThan(0.15);
    expect(r.dps).toBeGreaterThan(0);
  });

  it("fang uses wiki closed-form accuracy + 15-85% band", () => {
    const r = calculateDps(
      base({
        attackBonus: 100,
        strengthBonus: 100,
        weaponName: "Osmumten's fang",
        targetDefLevel: 150,
        targetDefBonus: 50,
      })
    );
    expect(r.attackShape).toBe("fang");
    // Wiki fangHitChance is strictly above independent double-roll of normal hit chance
    // for the same rolls, and above single-roll hitChance.
    const single = hitChance(r.attackRoll, r.defenseRoll);
    expect(r.accuracy).toBe(fangHitChance(r.attackRoll, r.defenseRoll));
    expect(r.accuracy).toBeGreaterThan(single);
    expect(r.expectedHit).toBeCloseTo(fangExpectedHit(r.maxHit, r.accuracy), 8);
  });

  it("scythe size-3 expected hit > size-1 at same gear", () => {
    const common = base({
      weaponName: "Scythe of vitur",
      attackBonus: 80,
      strengthBonus: 75,
      attackSpeed: 5,
      targetDefLevel: 50,
      targetDefBonus: 0,
    });
    const s1 = calculateDps({ ...common, monsterSize: 1 });
    const s3 = calculateDps({ ...common, monsterSize: 3 });
    // floor(m/2)+floor(m/4) makes ratio slightly under 1.75 for odd max hits
    expect(s3.expectedHit).toBeGreaterThan(s1.expectedHit * 1.5);
    expect(s3.expectedHit / s1.expectedHit).toBeLessThanOrEqual(1.75 + 1e-9);
  });

  it("Tumeken shadow triples gear magic dmg with 100% cap; ToA is 4×", () => {
    const out = calculateDps(
      base({
        combatStyle: "magic",
        attackBonus: 40,
        strengthBonus: 25,
        spellBaseMaxHit: 30,
        modifiers: [DPS_MODIFIERS.tumekens_shadow],
        attackSpeed: 5,
      })
    );
    // gear dmg 25*3=75 → max = floor(30 * 1.75) = 52
    expect(out.maxHit).toBe(52);
    expect(out.attackRoll).toBeGreaterThan(0);

    const toa = calculateDps(
      base({
        combatStyle: "magic",
        attackBonus: 40,
        strengthBonus: 25,
        spellBaseMaxHit: 30,
        modifiers: [DPS_MODIFIERS.tumekens_shadow],
        inToA: true,
        attackSpeed: 5,
      })
    );
    // 25*4=100 cap → floor(30 * 2.0) = 60
    expect(toa.maxHit).toBe(60);
  });

  it("piety + DHL ordered pipeline vs high def", () => {
    const r = calculateDps(
      base({
        attackBonus: 80,
        strengthBonus: 90,
        prayerAttackMult: 1.2,
        prayerStrengthMult: 1.23,
        stanceStrengthBonus: 3,
        attackSpeed: 4,
        targetDefLevel: 200,
        targetDefBonus: 50,
        targetHp: 500,
        modifiers: [DPS_MODIFIERS.dhl],
      })
    );
    expect(r.maxHit).toBeGreaterThan(30);
    expect(r.dps).toBeGreaterThan(1);
  });

  it("monster meta drives Xerician tbow cap and demon vuln defaults", () => {
    const olm = lookupMonsterMeta("Great Olm");
    expect(olm.attributes).toContain("xerician");
    const duke = lookupMonsterMeta("Duke Sucellus");
    expect(duke.demonbaneVulnerability).toBe(70);
  });

  it("diamond bolts raise EV at mid accuracy", () => {
    const plain = calculateDps(
      base({
        combatStyle: "ranged",
        attackBonus: 100,
        strengthBonus: 80,
        attackSpeed: 5,
        targetDefLevel: 200,
        targetDefBonus: 100,
      })
    );
    const bolts = calculateDps(
      base({
        combatStyle: "ranged",
        attackBonus: 100,
        strengthBonus: 80,
        attackSpeed: 5,
        targetDefLevel: 200,
        targetDefBonus: 100,
        boltEnchant: "diamond",
      })
    );
    expect(bolts.expectedHit).toBeGreaterThan(plain.expectedHit);
  });
});
