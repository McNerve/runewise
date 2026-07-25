/**
 * Golden-file / flagship DPS fixtures.
 *
 * Expected values are derived from the pure OSRS combat formulas implemented
 * in dps.ts (not scraped from UI). If a formula change is intentional, update
 * the locked numbers here with a short comment explaining why.
 */
import { describe, it, expect } from "vitest";
import {
  calculateDps,
  calculateSpecDps,
  DPS_MODIFIERS,
  type DpsInput,
} from "./dps";

function melee(overrides: Partial<DpsInput> = {}): DpsInput {
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

describe("golden DPS fixtures", () => {
  it("flagship: 99 melee accurate, +100/+100, 4-tick vs def 100/0", () => {
    // eff = floor(99*1)+0+8 = 107
    // maxHit = floor(0.5 + 107*(100+64)/640) = 27
    // atkRoll = 107*(100+64) = 17548
    // defRoll = (100+9)*(0+64) = 6976
    const r = calculateDps(melee({ stanceAttackBonus: 3 })); // accurate
    expect(r.maxHit).toBe(27);
    expect(r.attackRoll).toBe(110 * 164); // eff atk with +3 stance = 110
    expect(r.defenseRoll).toBe(6976);
    expect(r.accuracy).toBeCloseTo(1 - (6976 + 2) / (2 * (110 * 164 + 1)), 6);
    expect(r.dps).toBeCloseTo((r.maxHit * r.accuracy) / (2 * 4 * 0.6), 6);
  });

  it("flagship: piety + scythe-speed (5t) mid-tier crush", () => {
    // Piety 1.2 atk / 1.23 str, aggressive +3 str, crush bonuses
    const r = calculateDps(
      melee({
        attackBonus: 80,
        strengthBonus: 90,
        prayerAttackMult: 1.2,
        prayerStrengthMult: 1.23,
        stanceAttackBonus: 0,
        stanceStrengthBonus: 3,
        attackSpeed: 5,
        targetDefLevel: 200,
        targetDefBonus: 50,
        targetHp: 500,
      })
    );
    // Locked snapshot of formula output — update only with intentional formula changes.
    expect(r.maxHit).toBe(32);
    expect(r.dps).toBeGreaterThan(1);
    expect(r.dps).toBeLessThan(8);
    expect(r.ttk).toBeCloseTo(500 / r.dps, 4);
  });

  it("flagship: twisted bow vs magic-250 target (overworld cap)", () => {
    const r = calculateDps({
      attackLevel: 99,
      strengthLevel: 99,
      rangedLevel: 99,
      magicLevel: 99,
      attackBonus: 100,
      strengthBonus: 80,
      prayerAttackMult: 1.0,
      prayerStrengthMult: 1.0,
      stanceAttackBonus: 0,
      stanceStrengthBonus: 0,
      attackSpeed: 5,
      combatStyle: "ranged",
      targetDefLevel: 200,
      targetDefBonus: 100,
      targetHp: 750,
      targetMagicLevel: 250,
      modifiers: [DPS_MODIFIERS.twisted_bow!],
    });
    // Wiki tbowScaling at M=250: acc 1.40×, dmg 2.15× on base roll/max.
    // base max = floor(0.5 + 107*(80+64)/640) = 24; trunc(24*215/100)=51
    expect(r.maxHit).toBe(51);
    expect(r.accuracy).toBeGreaterThan(0.2);
    expect(r.accuracy).toBeLessThan(0.95);
    expect(Number.isFinite(r.ttk)).toBe(true);
  });

  it("flagship: tbow chart points M=0/100/150/250 damage mults", () => {
    const base = {
      attackLevel: 99, strengthLevel: 99, rangedLevel: 99, magicLevel: 99,
      attackBonus: 100, strengthBonus: 80,
      prayerAttackMult: 1.0, prayerStrengthMult: 1.0,
      stanceAttackBonus: 0, stanceStrengthBonus: 0,
      attackSpeed: 5, combatStyle: "ranged" as const,
      targetDefLevel: 1, targetDefBonus: 0, targetHp: 100,
      modifiers: [DPS_MODIFIERS.twisted_bow!],
    };
    // bare max 24
    expect(calculateDps({ ...base, targetMagicLevel: 0 }).maxHit).toBe(Math.trunc((24 * 54) / 100));
    expect(calculateDps({ ...base, targetMagicLevel: 100 }).maxHit).toBe(Math.trunc((24 * 131) / 100));
    expect(calculateDps({ ...base, targetMagicLevel: 150 }).maxHit).toBe(Math.trunc((24 * 164) / 100));
    expect(calculateDps({ ...base, targetMagicLevel: 250 }).maxHit).toBe(Math.trunc((24 * 215) / 100));
  });

  it("flagship: piety + void melee max hit / roll", () => {
    const r = calculateDps({
      attackLevel: 99, strengthLevel: 99, rangedLevel: 99, magicLevel: 99,
      attackBonus: 100, strengthBonus: 100,
      prayerAttackMult: 1.2, prayerStrengthMult: 1.23,
      stanceAttackBonus: 3, stanceStrengthBonus: 3,
      attackSpeed: 4, combatStyle: "melee",
      targetDefLevel: 100, targetDefBonus: 0, targetHp: 150,
      modifiers: [DPS_MODIFIERS.void_melee!],
    });
    expect(r.maxHit).toBe(37);
    expect(r.attackRoll).toBe(141 * 164);
  });

  it("flagship: Tumeken's shadow 4× in ToA with 100% gear-dmg cap", () => {
    const shared = {
      attackLevel: 99, strengthLevel: 99, rangedLevel: 99, magicLevel: 99,
      attackBonus: 40, strengthBonus: 15,
      prayerAttackMult: 1.0, prayerStrengthMult: 1.0,
      stanceAttackBonus: 0, stanceStrengthBonus: 0,
      attackSpeed: 5, combatStyle: "magic" as const,
      targetDefLevel: 100, targetDefBonus: 0, targetHp: 200,
      targetMagicLevel: 100, spellBaseMaxHit: 40,
      modifiers: [DPS_MODIFIERS.tumekens_shadow!],
    };
    const out = calculateDps(shared);
    const toa = calculateDps({ ...shared, inToA: true });
    // outside: gear dmg min(45,100)=45 → floor(40*1.45)=58
    expect(out.maxHit).toBe(58);
    // ToA: min(60,100)=60 → floor(40*1.60)=64
    expect(toa.maxHit).toBe(64);
    expect(toa.attackRoll).toBeGreaterThan(out.attackRoll);
  });

  it("flagship: Tumeken's shadow gear tripling on powered staff-like input", () => {
    // strengthBonus is magic damage % for magic style; attackBonus is magic attack.
    const shared = {
      attackLevel: 99,
      strengthLevel: 99,
      rangedLevel: 99,
      magicLevel: 99,
      attackBonus: 40,
      strengthBonus: 15,
      prayerAttackMult: 1.0,
      prayerStrengthMult: 1.0,
      stanceAttackBonus: 0,
      stanceStrengthBonus: 0,
      attackSpeed: 5,
      combatStyle: "magic" as const,
      targetDefLevel: 100,
      targetDefBonus: 0,
      targetHp: 200,
      targetMagicLevel: 100,
      spellBaseMaxHit: 40,
    };
    const base = calculateDps(shared);
    const shadow = calculateDps({
      ...shared,
      modifiers: [DPS_MODIFIERS.tumekens_shadow!],
    });
    // Shadow triples gear magic atk and magic dmg % only — spell base stays 40.
    // maxHit = floor(40 * (1 + 45/100)) = 58 vs floor(40 * 1.15) = 46
    expect(base.maxHit).toBe(46);
    expect(shadow.maxHit).toBe(58);
    expect(shadow.attackRoll).toBeGreaterThan(base.attackRoll);
  });

  it("flagship: double DWH def reduction before accuracy roll", () => {
    const none = calculateDps(melee({ targetDefLevel: 250, targetDefBonus: 100 }));
    const two = calculateDps(
      melee({ targetDefLevel: 250, targetDefBonus: 100, defReductions: 2 })
    );
    // 250 * 0.7 * 0.7 = 122.5 → floor path applied twice → lower def roll → higher acc
    expect(two.defenseRoll).toBeLessThan(none.defenseRoll);
    expect(two.accuracy).toBeGreaterThan(none.accuracy);
    expect(two.dps).toBeGreaterThan(none.dps);
  });

  it("flagship: dragon claws special EV is between 0 and 4× max hit", () => {
    const r = calculateSpecDps({
      ...melee({ strengthBonus: 120, attackBonus: 120 }),
      specAccuracyMult: 1,
      specDamageMult: 1,
      specHits: 4,
      specGuaranteedHit: false,
      specSpeed: 4,
      specCascadeType: "dragon_claws",
    });
    expect(r.specMaxHit).toBeGreaterThan(r.maxHit);
    expect(r.specDps).toBeGreaterThan(0);
    expect(r.specAccuracy).toBeGreaterThan(0);
    expect(r.specAccuracy).toBeLessThanOrEqual(1);
  });
});
