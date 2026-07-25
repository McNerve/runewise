import { describe, it, expect } from "vitest";
import { findNextUpgradeUnderBudget, findUpgradePathUnderBudget } from "./leftoverUpgrade";
import { findUpgrades } from "../dps-calc/upgradeFinder";
import type { WikiEquipment, EquipmentSlot } from "../../lib/api/equipment";
import type { EquippedGear } from "../dps-calc/dpsTypes";
import type { DpsInput } from "../../lib/formulas/dps";

function item(
  name: string,
  slot: EquipmentSlot | "2h",
  overrides: Partial<WikiEquipment> = {}
): WikiEquipment {
  return {
    name,
    version: null,
    slot: slot as EquipmentSlot,
    attackStab: 0,
    attackSlash: 0,
    attackCrush: 0,
    attackMagic: 0,
    attackRanged: 0,
    defenceStab: 0,
    defenceSlash: 0,
    defenceCrush: 0,
    defenceMagic: 0,
    defenceRanged: 0,
    strengthBonus: 0,
    rangedStrength: 0,
    magicDamage: 0,
    prayerBonus: 0,
    combatStyle: null,
    attackSpeed: 0,
    ...overrides,
  };
}

const baseInput: DpsInput = {
  attackLevel: 99,
  strengthLevel: 99,
  rangedLevel: 99,
  magicLevel: 99,
  attackBonus: 100,
  strengthBonus: 80,
  prayerAttackMult: 1,
  prayerStrengthMult: 1,
  stanceAttackBonus: 0,
  stanceStrengthBonus: 3,
  attackSpeed: 4,
  combatStyle: "melee",
  targetDefLevel: 100,
  targetDefBonus: 50,
  targetHp: 200,
  attackType: "slash",
};

describe("findNextUpgradeUnderBudget", () => {
  // Same pattern as upgradeFinder.test.ts neck ranking
  const helm = item("Rune full helm", "head", { attackSlash: 0, strengthBonus: 0 });
  const torture = item("Amulet of torture", "neck", { attackSlash: 15, strengthBonus: 30 });
  const fury = item("Amulet of fury", "neck", { attackSlash: 10, strengthBonus: 20 });
  const glory = item("Amulet of glory", "neck", { attackSlash: 10, strengthBonus: 6 });
  const catalog = [helm, torture, fury, glory];

  it("findUpgrades sees neck upgrades (sanity)", () => {
    const gear: EquippedGear = { head: helm, neck: glory };
    const results = findUpgrades({
      baseInput,
      gear,
      equipment: catalog,
      combatStyle: "melee",
      meleeAttackType: "slash",
    });
    const neck = results.find((r) => r.slot === "neck");
    expect(neck?.upgrades.length).toBeGreaterThan(0);
  });

  it("picks best DPS upgrade within remaining budget", () => {
    const gear: EquippedGear = { head: helm, neck: glory };
    const prices: Record<string, number> = {
      "amulet of glory": 12_000,
      "amulet of fury": 2_000_000,
      "amulet of torture": 20_000_000,
      "rune full helm": 20_000,
    };
    const next = findNextUpgradeUnderBudget({
      gear,
      combatStyle: "melee",
      equipment: catalog,
      priceOf: (n) => prices[n.toLowerCase()] ?? null,
      remainingBudget: 3_000_000,
      baseInput,
      meleeAttackType: "slash",
    });
    expect(next).not.toBeNull();
    // Fury fits under 3M; torture does not
    expect(next!.item.name).toBe("Amulet of fury");
    expect(next!.price).toBe(2_000_000);
    expect(next!.dpsGain).toBeGreaterThan(0);
  });

  it("returns null when nothing fits the leftover", () => {
    const gear: EquippedGear = { head: helm, neck: glory };
    const next = findNextUpgradeUnderBudget({
      gear,
      combatStyle: "melee",
      equipment: catalog,
      priceOf: () => 50_000_000,
      remainingBudget: 100,
      baseInput,
    });
    expect(next).toBeNull();
  });

  it("builds a multi-step path under budget", () => {
    const gear: EquippedGear = { head: helm, neck: glory };
    const prices: Record<string, number> = {
      "amulet of glory": 12_000,
      "amulet of fury": 100_000,
      "amulet of torture": 500_000,
      "rune full helm": 20_000,
    };
    const path = findUpgradePathUnderBudget({
      gear,
      combatStyle: "melee",
      equipment: catalog,
      priceOf: (n) => prices[n.toLowerCase()] ?? null,
      remainingBudget: 2_000_000,
      baseInput,
      meleeAttackType: "slash",
      maxSteps: 3,
    });
    expect(path.length).toBeGreaterThanOrEqual(1);
    expect(path[0]!.item.name).toMatch(/torture|fury/i);
  });
});
