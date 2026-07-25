import { describe, it, expect } from "vitest";
import {
  lookupMonsterMeta,
  monsterHasAttribute,
  inferAttributesFromName,
  mergeMonsterMeta,
} from "./monster-attributes";

describe("lookupMonsterMeta", () => {
  it("marks CoX targets as Xerician with large size for Olm", () => {
    const olm = lookupMonsterMeta("Great Olm");
    expect(olm.attributes).toContain("xerician");
    expect(olm.size).toBeGreaterThanOrEqual(3);
  });

  it("detects undead dragons and demons", () => {
    expect(monsterHasAttribute("Vorkath", "dragon")).toBe(true);
    expect(monsterHasAttribute("Vorkath", "undead")).toBe(true);
    expect(monsterHasAttribute("K'ril Tsutsaroth", "demon")).toBe(true);
    expect(lookupMonsterMeta("Duke Sucellus").demonbaneVulnerability).toBe(70);
    expect(lookupMonsterMeta("Yama").demonbaneVulnerability).toBe(120);
    expect(lookupMonsterMeta("Ice demon").demonbaneVulnerability).toBe(115);
  });

  it("defaults unknown NPCs to size 1 with no attributes", () => {
    expect(lookupMonsterMeta("Goblin")).toEqual({ size: 1, attributes: [] });
  });

  it("matches leafy slayer targets", () => {
    expect(monsterHasAttribute("Kurask", "leafy")).toBe(true);
    expect(lookupMonsterMeta("Kurask").size).toBe(2);
  });

  it("infers attributes from name when not curated", () => {
    const meta = lookupMonsterMeta("Weird jungle demon");
    expect(meta.attributes).toContain("demon");
    expect(meta.size).toBe(1);
  });

  it("covers wildy and wyvern entries", () => {
    expect(monsterHasAttribute("Vet'ion", "undead")).toBe(true);
    expect(monsterHasAttribute("Skeletal Wyvern", "dragon")).toBe(true);
    expect(monsterHasAttribute("Skeletal Wyvern", "undead")).toBe(true);
    expect(monsterHasAttribute("Tormented Demon", "demon")).toBe(true);
  });

  it("merges live wiki size over curated defaults", () => {
    const merged = lookupMonsterMeta("Goblin", null, { size: 2, attributes: ["rat"] });
    expect(merged.size).toBe(2);
    expect(merged.attributes).toContain("rat");
  });
});

describe("inferAttributesFromName", () => {
  it("tags common type tokens", () => {
    expect(inferAttributesFromName("Blue dragon")).toContain("dragon");
    expect(inferAttributesFromName("Abyssal demon")).toContain("demon");
    expect(inferAttributesFromName("Revenant ork")).toContain("undead");
  });
});

describe("mergeMonsterMeta", () => {
  it("unions attributes and prefers live size", () => {
    const m = mergeMonsterMeta(
      { size: 1, attributes: ["demon"] },
      { size: 3, attributes: ["dragon"] }
    );
    expect(m.size).toBe(3);
    expect(m.attributes).toEqual(expect.arrayContaining(["demon", "dragon"]));
  });
});
