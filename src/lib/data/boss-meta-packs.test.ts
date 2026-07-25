import { describe, it, expect } from "vitest";
import { getMetaPacksForBoss, BOSS_META_PACKS } from "./boss-meta-packs";
import { GEAR_PRESETS } from "./gear-presets";

describe("boss meta packs", () => {
  it("resolves Vorkath packs to known presets", () => {
    const packs = getMetaPacksForBoss("Vorkath");
    expect(packs.length).toBeGreaterThanOrEqual(1);
    for (const p of packs) {
      expect(GEAR_PRESETS.some((g) => g.name === p.preset)).toBe(true);
    }
  });

  it("aliases CoX challenge mode to CoX packs", () => {
    const packs = getMetaPacksForBoss("Chambers of Xeric: Challenge Mode");
    expect(packs.some((p) => p.preset === "Max Ranged" || p.preset === "Scythe (Multi)")).toBe(
      true
    );
  });

  it("returns empty for unknown bosses", () => {
    expect(getMetaPacksForBoss("Definitely Not A Boss")).toEqual([]);
  });

  it("every pack preset exists", () => {
    const names = new Set(GEAR_PRESETS.map((g) => g.name));
    for (const p of BOSS_META_PACKS) {
      expect(names.has(p.preset)).toBe(true);
    }
  });
});
