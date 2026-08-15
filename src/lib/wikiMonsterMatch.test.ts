import { describe, expect, it } from "vitest";
import type { WikiMonster } from "./api/monsters";
import { parseMonsterRef, resolveWikiMonster } from "./wikiMonsterMatch";

function mon(partial: Partial<WikiMonster> & { name: string }): WikiMonster {
  return {
    version: null,
    combatLevel: 100,
    hitpoints: 200,
    maxHit: 20,
    attackSpeed: 4,
    attackStyles: [],
    attackLevel: 100,
    strengthLevel: 100,
    defenceLevel: 100,
    magicLevel: 50,
    rangedLevel: 50,
    slayerLevel: 0,
    slayerXp: 0,
    defStab: 10,
    defSlash: 20,
    defCrush: 30,
    defMagic: 40,
    defRanged: 15,
    attackBonus: 0,
    strengthBonus: 0,
    magicAttackBonus: 0,
    rangedAttackBonus: 0,
    magicDamageBonus: 0,
    image: null,
    examine: null,
    ...partial,
  };
}

const vorkaths = [
  mon({ name: "Vorkath", version: "Dragon Slayer II", hitpoints: 460, defenceLevel: 214 }),
  mon({ name: "Vorkath", version: "Post-quest", hitpoints: 750, defenceLevel: 214 }),
];

describe("parseMonsterRef", () => {
  it("splits a parenthetical version", () => {
    expect(parseMonsterRef("Vorkath (Post-quest)")).toEqual({
      name: "Vorkath",
      version: "Post-quest",
    });
  });

  it("leaves a bare name alone", () => {
    expect(parseMonsterRef("Vorkath")).toEqual({ name: "Vorkath", version: null });
  });
});

describe("resolveWikiMonster", () => {
  it("picks the highest-HP Vorkath when no version is given", () => {
    const hit = resolveWikiMonster(vorkaths, "Vorkath");
    expect(hit?.version).toBe("Post-quest");
    expect(hit?.hitpoints).toBe(750);
  });

  it("honors an explicit version param", () => {
    const hit = resolveWikiMonster(vorkaths, "Vorkath", "Dragon Slayer II");
    expect(hit?.hitpoints).toBe(460);
  });

  it("matches Vorkath#Post-quest page_name_sub against Post-quest", () => {
    const list = [
      mon({ name: "Vorkath", version: "Vorkath#Post-quest", hitpoints: 750 }),
      mon({ name: "Vorkath", version: "Vorkath#Dragon Slayer II", hitpoints: 460 }),
    ];
    expect(resolveWikiMonster(list, "Vorkath", "Post-quest")?.hitpoints).toBe(750);
  });

  it("parses version out of the display name", () => {
    const hit = resolveWikiMonster(vorkaths, "Vorkath (Dragon Slayer II)");
    expect(hit?.hitpoints).toBe(460);
  });

  it("prefers an unversioned row over higher-HP variants", () => {
    const list = [
      mon({ name: "Great Olm", version: "Left claw", hitpoints: 800 }),
      mon({ name: "Great Olm", version: null, hitpoints: 500 }),
    ];
    expect(resolveWikiMonster(list, "Great Olm")?.version).toBeNull();
  });
});
