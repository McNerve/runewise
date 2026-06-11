import { describe, it, expect } from "vitest";
import { knownWeaponSpeed } from "./weapon-speeds";

describe("knownWeaponSpeed", () => {
  it("resolves exact meta weapons", () => {
    expect(knownWeaponSpeed("Scythe of vitur")).toBe(5);
    expect(knownWeaponSpeed("Osmumten's fang")).toBe(5);
    expect(knownWeaponSpeed("Toxic blowpipe")).toBe(3);
    expect(knownWeaponSpeed("Twisted bow")).toBe(5);
    expect(knownWeaponSpeed("Tumeken's shadow")).toBe(5);
    expect(knownWeaponSpeed("Sanguinesti staff")).toBe(4);
  });

  it("resolves suffix families", () => {
    expect(knownWeaponSpeed("Dragon scimitar")).toBe(4);
    expect(knownWeaponSpeed("Rune scimitar")).toBe(4);
    expect(knownWeaponSpeed("Bandos godsword")).toBe(6);
    expect(knownWeaponSpeed("Abyssal whip")).toBe(4);
    expect(knownWeaponSpeed("Magic shortbow")).toBe(4);
    expect(knownWeaponSpeed("Rune 2h sword")).toBe(7);
    expect(knownWeaponSpeed("Crystal halberd")).toBe(7);
  });

  it("lets exact exceptions beat their suffix family", () => {
    expect(knownWeaponSpeed("Leaf-bladed battleaxe")).toBe(5);
    expect(knownWeaponSpeed("Rune battleaxe")).toBe(6);
    expect(knownWeaponSpeed("Inquisitor's mace")).toBe(4);
    expect(knownWeaponSpeed("Dragon mace")).toBe(5);
  });

  it("orders overlapping suffixes longest-first", () => {
    expect(knownWeaponSpeed("Ursine chainmace")).toBe(4);
    expect(knownWeaponSpeed("Viggora's chainmace")).toBe(4);
  });

  it("returns null for unverified weapons", () => {
    expect(knownWeaponSpeed("Rune crossbow")).toBeNull();
    expect(knownWeaponSpeed("Guthan's warspear")).toBeNull();
    expect(knownWeaponSpeed("Some unknown weapon")).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(knownWeaponSpeed("ABYSSAL WHIP")).toBe(4);
  });
});
