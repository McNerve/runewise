import { describe, it, expect } from "vitest";
import { lookupMonsterMeta, monsterHasAttribute } from "./monster-attributes";

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
  });

  it("defaults unknown NPCs to size 1", () => {
    expect(lookupMonsterMeta("Goblin")).toEqual({ size: 1, attributes: [] });
  });

  it("matches leafy slayer targets", () => {
    expect(monsterHasAttribute("Kurask", "leafy")).toBe(true);
    expect(lookupMonsterMeta("Kurask").size).toBe(2);
  });
});
