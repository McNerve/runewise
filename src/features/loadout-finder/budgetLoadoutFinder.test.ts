import { describe, it, expect } from "vitest";
import {
  findBudgetLoadouts,
  FINDER_TARGETS,
  resolveTargetDefBonus,
  filterPassivesForTarget,
  bestMeleeAttackType,
  withOwnedPrices,
  filterExcludedEquipment,
  type LoadoutTarget,
} from "./budgetLoadoutFinder";
import type { WikiEquipment, EquipmentSlot } from "../../lib/api/equipment";
import type { HiscoreData } from "../../lib/api/hiscores";

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

/** Minimal catalog covering Early Melee + Budget Melee slots used in tests. */
function catalog(): WikiEquipment[] {
  return [
    item("Rune full helm", "head", { attackSlash: 0, strengthBonus: 0 }),
    item("Rune platebody", "body"),
    item("Rune platelegs", "legs"),
    item("Mythical cape", "cape"),
    item("Amulet of glory", "neck", { attackSlash: 10, strengthBonus: 6 }),
    item("Dragon scimitar", "weapon", {
      attackSlash: 67,
      strengthBonus: 66,
      attackSpeed: 4,
      combatStyle: "slash",
    }),
    item("Rune kiteshield", "shield"),
    item("Combat bracelet", "hands"),
    item("Rune boots", "feet"),
    item("Warrior ring", "ring", { attackSlash: 4 }),
    // Budget melee pieces
    item("Helm of neitiznot", "head", { attackSlash: 0, strengthBonus: 3 }),
    item("Fighter torso", "body", { strengthBonus: 4 }),
    item("Obsidian platelegs", "legs", { strengthBonus: 1 }),
    item("Fire cape", "cape", { strengthBonus: 4 }),
    item("Amulet of fury", "neck", { attackSlash: 10, strengthBonus: 8 }),
    item("Abyssal whip", "weapon", {
      attackSlash: 82,
      strengthBonus: 82,
      attackSpeed: 4,
      combatStyle: "slash",
    }),
    item("Dragon defender", "shield", { attackSlash: 25, strengthBonus: 6 }),
    item("Barrows gloves", "hands", { attackSlash: 12, strengthBonus: 12 }),
    item("Dragon boots", "feet", { strengthBonus: 4 }),
    item("Berserker ring (i)", "ring", { strengthBonus: 8 }),
    // Expensive max pieces (for budget filter)
    item("Torva full helm", "head", { strengthBonus: 8 }),
    item("Torva platebody", "body", { strengthBonus: 6 }),
    item("Torva platelegs", "legs", { strengthBonus: 4 }),
    item("Infernal cape", "cape", { strengthBonus: 8 }),
    item("Amulet of torture", "neck", { attackSlash: 15, strengthBonus: 10 }),
    item("Ghrazi rapier", "weapon", {
      attackStab: 94,
      strengthBonus: 89,
      attackSpeed: 4,
      combatStyle: "stab",
    }),
    item("Avernic defender", "shield", { attackSlash: 30, strengthBonus: 8 }),
    item("Ferocious gloves", "hands", { attackSlash: 16, strengthBonus: 14 }),
    item("Primordial boots", "feet", { strengthBonus: 5 }),
    item("Ultor ring", "ring", { strengthBonus: 12 }),
    item("Rada's blessing 4", "ammo"),
  ];
}

const maxStats: HiscoreData = {
  skills: [
    { id: 0, name: "Attack", rank: 1, level: 99, xp: 13_034_431 },
    { id: 1, name: "Defence", rank: 1, level: 99, xp: 13_034_431 },
    { id: 2, name: "Strength", rank: 1, level: 99, xp: 13_034_431 },
    { id: 3, name: "Hitpoints", rank: 1, level: 99, xp: 13_034_431 },
    { id: 4, name: "Ranged", rank: 1, level: 99, xp: 13_034_431 },
    { id: 5, name: "Prayer", rank: 1, level: 99, xp: 13_034_431 },
    { id: 6, name: "Magic", rank: 1, level: 99, xp: 13_034_431 },
  ],
  activities: [],
};

const dummy: LoadoutTarget = {
  name: "Custom / Dummy",
  defLevel: 100,
  defBonus: 0,
  hp: 150,
};

const prices: Record<string, number> = {
  "rune full helm": 20_000,
  "rune platebody": 40_000,
  "rune platelegs": 40_000,
  "mythical cape": 0,
  "amulet of glory": 12_000,
  "dragon scimitar": 60_000,
  "rune kiteshield": 30_000,
  "combat bracelet": 15_000,
  "rune boots": 8_000,
  "warrior ring": 50_000,
  "helm of neitiznot": 50_000,
  "fighter torso": 0,
  "obsidian platelegs": 200_000,
  "fire cape": 0,
  "amulet of fury": 2_000_000,
  "abyssal whip": 1_500_000,
  "dragon defender": 0,
  "barrows gloves": 0,
  "dragon boots": 100_000,
  "berserker ring (i)": 3_000_000,
  "torva full helm": 200_000_000,
  "torva platebody": 300_000_000,
  "torva platelegs": 250_000_000,
  "infernal cape": 0,
  "amulet of torture": 20_000_000,
  "ghrazi rapier": 150_000_000,
  "avernic defender": 0,
  "ferocious gloves": 80_000_000,
  "primordial boots": 30_000_000,
  "ultor ring": 100_000_000,
  "rada's blessing 4": 0,
};

describe("findBudgetLoadouts", () => {
  it("ranks setups by DPS and returns results", () => {
    const ranked = findBudgetLoadouts({
      equipment: catalog(),
      priceOf: (n) => prices[n.toLowerCase()] ?? null,
      hiscores: maxStats,
      target: dummy,
      budget: 0, // unlimited
      styles: ["melee"],
      limit: 10,
    });
    expect(ranked.length).toBeGreaterThan(0);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1]!.dps).toBeGreaterThanOrEqual(ranked[i]!.dps);
    }
    // Max Melee should beat Early Melee on max stats
    const max = ranked.find((r) => r.preset.name === "Max Melee");
    const early = ranked.find((r) => r.preset.name === "Early Melee");
    expect(max).toBeDefined();
    expect(early).toBeDefined();
    expect(max!.dps).toBeGreaterThan(early!.dps);
  });

  it("filters out presets over budget", () => {
    const tight = findBudgetLoadouts({
      equipment: catalog(),
      priceOf: (n) => prices[n.toLowerCase()] ?? null,
      hiscores: maxStats,
      target: dummy,
      budget: 500_000, // early-ish only
      styles: ["melee"],
      limit: 20,
    });
    expect(tight.every((r) => r.totalCost <= 500_000)).toBe(true);
    expect(tight.some((r) => r.preset.name === "Max Melee")).toBe(false);
    expect(tight.some((r) => r.preset.name === "Early Melee")).toBe(true);
  });

  it("respects style filter", () => {
    const ranged = findBudgetLoadouts({
      equipment: catalog(),
      priceOf: () => 1000,
      hiscores: maxStats,
      target: dummy,
      budget: 0,
      styles: ["ranged"],
      limit: 20,
    });
    // Catalog has no ranged pieces → resolved may be 0 for all, empty OK
    expect(ranged.every((r) => r.style === "ranged")).toBe(true);
  });

  it("exposes curated boss targets with multi-def", () => {
    expect(FINDER_TARGETS.length).toBeGreaterThanOrEqual(5);
    const vork = FINDER_TARGETS.find((t) => t.name === "Vorkath");
    expect(vork).toBeTruthy();
    expect(vork!.defStab).toBe(26);
    expect(vork!.defSlash).toBeGreaterThan(vork!.defStab!);
    expect(FINDER_TARGETS.some((t) => t.name === "Cerberus")).toBe(true);
  });

  it("owned items count as free under budget", () => {
    const priceOf = (n: string) => {
      const p: Record<string, number> = {
        "dragon scimitar": 100_000,
        "fire cape": 0, // untradeable normally unpriced
        "abyssal whip": 1_500_000,
      };
      return p[n.toLowerCase()] ?? 50_000;
    };
    const free = withOwnedPrices(priceOf, ["Abyssal whip"]);
    expect(free("Abyssal whip")).toBe(0);
    expect(free("Dragon scimitar")).toBe(100_000);
  });

  it("excludes banned items from catalog", () => {
    const filtered = filterExcludedEquipment(catalog(), ["Abyssal whip", "Torva full helm"]);
    expect(filtered.some((e) => e.name === "Abyssal whip")).toBe(false);
    expect(filtered.some((e) => e.name === "Dragon scimitar")).toBe(true);
  });
});

describe("resolveTargetDefBonus", () => {
  const multi: LoadoutTarget = {
    name: "Cerberus",
    defLevel: 100,
    defBonus: 100,
    defStab: 100,
    defSlash: 100,
    defCrush: 50,
    defRanged: 100,
    defMagic: 100,
    hp: 600,
  };

  it("uses crush def when melee crush", () => {
    expect(resolveTargetDefBonus(multi, "melee", "crush")).toBe(50);
    expect(resolveTargetDefBonus(multi, "melee", "slash")).toBe(100);
  });

  it("uses ranged/magic columns", () => {
    expect(resolveTargetDefBonus(multi, "ranged")).toBe(100);
    expect(resolveTargetDefBonus({ ...multi, defMagic: 20 }, "magic")).toBe(20);
  });
});

describe("filterPassivesForTarget", () => {
  it("keeps salve only vs undead and DHL only vs dragon", () => {
    expect(filterPassivesForTarget(["salve_ei", "dhl", "void_melee"], ["undead"], false)).toEqual([
      "salve_ei",
      "void_melee",
    ]);
    expect(filterPassivesForTarget(["salve_ei", "dhl", "void_melee"], ["dragon"], false)).toEqual([
      "dhl",
      "void_melee",
    ]);
    expect(filterPassivesForTarget(["slayer_helm"], [], true)).toEqual(["slayer_helm"]);
    expect(filterPassivesForTarget(["slayer_helm"], [], false)).toEqual([]);
  });
});

describe("bestMeleeAttackType", () => {
  it("prefers crush vs Cerberus-style multi-def when weapon is general", () => {
    const t = bestMeleeAttackType(
      null,
      { attackStab: 80, attackSlash: 80, attackCrush: 80 },
      {
        name: "Cerberus",
        defLevel: 100,
        defBonus: 100,
        defStab: 100,
        defSlash: 100,
        defCrush: 50,
        hp: 600,
      }
    );
    expect(t).toBe("crush");
  });

  it("locks rapier to stab", () => {
    expect(
      bestMeleeAttackType(
        item("Ghrazi rapier", "weapon", { attackStab: 94, combatStyle: "stab" }),
        { attackStab: 94, attackSlash: 0, attackCrush: 0 },
        null
      )
    ).toBe("stab");
  });
});
