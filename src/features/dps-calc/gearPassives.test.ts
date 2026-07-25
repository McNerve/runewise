import { describe, it, expect } from "vitest";
import {
  detectGearPassives,
  countCrystalPieces,
  countInquisitorBonus,
  hasSmokeStaff,
  hasChaosGauntlets,
} from "./gearPassives";
import type { WikiEquipment } from "../../lib/api/equipment";
import type { EquippedGear } from "./dpsTypes";

function item(name: string, slot: WikiEquipment["slot"] = "weapon"): WikiEquipment {
  return {
    name,
    slot,
    version: null,
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
    attackSpeed: 0,
    combatStyle: null,
  };
}

describe("detectGearPassives", () => {
  it("detects twisted bow and tumeken's shadow from weapon", () => {
    const tbow: EquippedGear = { weapon: item("Twisted bow", "2h") };
    expect(detectGearPassives(tbow, "ranged")).toContain("twisted_bow");

    const shadow: EquippedGear = { weapon: item("Tumeken's shadow", "weapon") };
    expect(detectGearPassives(shadow, "magic")).toContain("tumekens_shadow");
  });

  it("detects DHL/DHCB and salve from slots", () => {
    expect(
      detectGearPassives({ weapon: item("Dragon hunter lance") }, "melee")
    ).toContain("dhl");
    expect(
      detectGearPassives(
        { neck: item("Salve amulet (ei)", "neck") },
        "melee"
      )
    ).toContain("salve_ei");
  });

  it("detects void melee set", () => {
    const gear: EquippedGear = {
      head: item("Void melee helm", "head"),
      body: item("Void knight top", "body"),
      legs: item("Void knight robe", "legs"),
      hands: item("Void knight gloves", "hands"),
    };
    expect(detectGearPassives(gear, "melee")).toContain("void_melee");
  });

  it("detects elite void magic from helm + elite pieces", () => {
    const gear: EquippedGear = {
      head: item("Void mage helm", "head"),
      body: item("Elite void top", "body"),
      legs: item("Elite void robe", "legs"),
      hands: item("Void knight gloves", "hands"),
    };
    expect(detectGearPassives(gear, "magic")).toContain("elite_void_magic");
  });

  it("detects inquisitor and crystal set", () => {
    const inq: EquippedGear = {
      head: item("Inquisitor's great helm", "head"),
      weapon: item("Inquisitor's mace", "weapon"),
    };
    expect(detectGearPassives(inq, "melee")).toContain("inquisitor");

    const crystal: EquippedGear = {
      head: item("Crystal helm", "head"),
      body: item("Crystal body", "body"),
      legs: item("Crystal legs", "legs"),
      weapon: item("Bow of faerdhinen", "2h"),
    };
    expect(detectGearPassives(crystal, "ranged")).toContain("crystal_armour");
  });

  it("detects tome of fire on magic only", () => {
    const gear: EquippedGear = { shield: item("Tome of fire", "shield") };
    expect(detectGearPassives(gear, "magic")).toContain("tome_of_fire");
    expect(detectGearPassives(gear, "melee")).not.toContain("tome_of_fire");
  });

  it("counts crystal and inquisitor pieces", () => {
    const crystal: EquippedGear = {
      head: item("Crystal helm", "head"),
      body: item("Crystal body", "body"),
      legs: item("Crystal legs", "legs"),
    };
    expect(countCrystalPieces(crystal)).toBe(6);
    expect(countCrystalPieces({ head: item("Crystal helm", "head") })).toBe(1);

    const inq: EquippedGear = {
      head: item("Inquisitor's great helm", "head"),
      body: item("Inquisitor's hauberk", "body"),
      legs: item("Inquisitor's plateskirt", "legs"),
    };
    expect(countInquisitorBonus(inq)).toBe(5);
  });

  it("detects smoke staff and chaos gauntlets", () => {
    expect(hasSmokeStaff({ weapon: item("Mystic smoke staff", "weapon") })).toBe(true);
    expect(hasChaosGauntlets({ hands: item("Chaos gauntlets", "hands") })).toBe(true);
  });

  it("detects partial crystal with bowfa", () => {
    const gear: EquippedGear = {
      head: item("Crystal helm", "head"),
      weapon: item("Bow of faerdhinen", "2h"),
    };
    expect(detectGearPassives(gear, "ranged")).toContain("crystal_armour");
  });
});
