import { describe, it, expect } from "vitest";
import { findUpgrades } from "./upgradeFinder";
import type { DpsInput } from "../../lib/formulas/dps";
import type { WikiEquipment, EquipmentSlot } from "../../lib/api/equipment";
import type { EquippedGear } from "./hooks/useDpsState";

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
};

describe("findUpgrades", () => {
  const helm = item("Rune full helm", "head", { attackSlash: 0, strengthBonus: 0 });
  const torture = item("Amulet of torture", "neck", { attackSlash: 15, strengthBonus: 30 });
  const fury = item("Amulet of fury", "neck", { attackSlash: 10, strengthBonus: 20 });
  const glory = item("Amulet of glory", "neck", { attackSlash: 10, strengthBonus: 6 });
  const catalog = [helm, torture, fury, glory];

  it("ranks neck upgrades by DPS gain", () => {
    const gear: EquippedGear = { head: helm, neck: glory };
    const results = findUpgrades({
      baseInput,
      gear,
      equipment: catalog,
      combatStyle: "melee",
      meleeAttackType: "slash",
    });
    const neck = results.find((r) => r.slot === "neck");
    expect(neck).toBeDefined();
    expect(neck!.upgrades.map((u) => u.item.name)).toEqual([
      "Amulet of torture",
      "Amulet of fury",
    ]);
    expect(neck!.upgrades[0].dpsGain).toBeGreaterThan(neck!.upgrades[1].dpsGain);
    expect(neck!.upgrades[0].dpsGainPct).toBeGreaterThan(0);
  });

  it("excludes the currently equipped item and non-upgrades", () => {
    const gear: EquippedGear = { neck: torture };
    const results = findUpgrades({
      baseInput,
      gear,
      equipment: catalog,
      combatStyle: "melee",
      meleeAttackType: "slash",
    });
    const neck = results.find((r) => r.slot === "neck");
    // Torture is BiS in this catalog — nothing should beat it.
    expect(neck!.upgrades).toEqual([]);
  });

  it("skips the shield slot when a 2h weapon is equipped", () => {
    const shield = item("Dragon defender", "shield", { attackSlash: 25, strengthBonus: 6 });
    const gear: EquippedGear = { "2h": item("Godsword", "2h") };
    const results = findUpgrades({
      baseInput,
      gear,
      equipment: [...catalog, shield],
      combatStyle: "melee",
      meleeAttackType: "slash",
    });
    expect(results.find((r) => r.slot === "shield")).toBeUndefined();
  });

  it("never scans the weapon slots", () => {
    const weapon = item("Abyssal whip", "weapon", { attackSlash: 82, strengthBonus: 82 });
    const results = findUpgrades({
      baseInput,
      gear: {},
      equipment: [weapon],
      combatStyle: "melee",
      meleeAttackType: "slash",
    });
    expect(results.some((r) => r.slot === "weapon" || r.slot === "2h")).toBe(false);
  });

  it("uses ranged bonuses for the ranged style", () => {
    const ava = item("Ava's assembler", "cape", { attackRanged: 8, rangedStrength: 2 });
    const plainCape = item("Obsidian cape", "cape", { attackSlash: 9, strengthBonus: 5 });
    const results = findUpgrades({
      baseInput: { ...baseInput, combatStyle: "ranged" },
      gear: {},
      equipment: [ava, plainCape],
      combatStyle: "ranged",
      meleeAttackType: "slash",
    });
    const cape = results.find((r) => r.slot === "cape");
    expect(cape!.upgrades.map((u) => u.item.name)).toEqual(["Ava's assembler"]);
  });

  it("respects the per-slot limit", () => {
    const necks = Array.from({ length: 6 }, (_, i) =>
      item(`Amulet ${i}`, "neck", { attackSlash: i + 1, strengthBonus: i + 1 })
    );
    const results = findUpgrades({
      baseInput,
      gear: {},
      equipment: necks,
      combatStyle: "melee",
      meleeAttackType: "slash",
      perSlot: 2,
    });
    const neck = results.find((r) => r.slot === "neck");
    expect(neck!.upgrades).toHaveLength(2);
    expect(neck!.upgrades[0].item.name).toBe("Amulet 5");
  });
});
