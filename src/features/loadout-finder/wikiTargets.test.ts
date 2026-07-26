import { describe, it, expect } from "vitest";
import type { WikiMonster } from "../../lib/api/monsters";
import {
  wikiMonsterToTarget,
  findWikiMonster,
  enrichTargetFromWiki,
  buildFinderTargetList,
} from "./wikiTargets";
import type { LoadoutTarget } from "./budgetLoadoutFinder";

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

describe("wikiMonsterToTarget", () => {
  it("maps multi-def and version label", () => {
    const t = wikiMonsterToTarget(
      mon({ name: "Vorkath", version: "Post-quest", defStab: 26, defSlash: 108, hitpoints: 750 })
    );
    expect(t.name).toBe("Vorkath (Post-quest)");
    expect(t.defStab).toBe(26);
    expect(t.defSlash).toBe(108);
    expect(t.hp).toBe(750);
  });
});

describe("findWikiMonster", () => {
  const list = [
    mon({ name: "Vorkath", defStab: 26, hitpoints: 750 }),
    mon({ name: "Cerberus", defCrush: 50, hitpoints: 600 }),
    mon({ name: "Great Olm", version: "Left claw", hitpoints: 100 }),
    mon({ name: "Great Olm", version: null, hitpoints: 500 }),
  ];

  it("finds exact and prefers higher HP / no version", () => {
    expect(findWikiMonster(list, "Vorkath")?.hitpoints).toBe(750);
    expect(findWikiMonster(list, "great olm")?.version).toBeNull();
  });
});

describe("enrichTargetFromWiki", () => {
  it("overlays live def onto curated target", () => {
    const base: LoadoutTarget = {
      name: "Cerberus",
      defLevel: 1,
      defBonus: 0,
      hp: 1,
      preferDefStyle: "crush",
    };
    const enriched = enrichTargetFromWiki(base, [
      mon({ name: "Cerberus", defenceLevel: 100, defCrush: 50, hitpoints: 600 }),
    ]);
    expect(enriched.defLevel).toBe(100);
    expect(enriched.defCrush).toBe(50);
    expect(enriched.hp).toBe(600);
    expect(enriched.preferDefStyle).toBe("crush");
  });
});

describe("buildFinderTargetList", () => {
  it("appends search hits for free-text query", () => {
    const curated: LoadoutTarget[] = [
      { name: "Vorkath", defLevel: 214, defBonus: 26, hp: 750 },
      { name: "Custom / Dummy", defLevel: 100, defBonus: 0, hp: 150 },
    ];
    const monsters = [
      mon({ name: "Vorkath", hitpoints: 750 }),
      mon({ name: "Zulrah", hitpoints: 500 }),
      mon({ name: "Zul-Andra teleport", hitpoints: 1 }), // noise if query zul
    ];
    const list = buildFinderTargetList(curated, monsters, "zul");
    expect(list.some((t) => t.name.includes("Zulrah"))).toBe(true);
    expect(list[list.length - 1]?.name).toBe("Custom / Dummy");
  });
});
