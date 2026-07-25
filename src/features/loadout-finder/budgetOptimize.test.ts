import { describe, it, expect } from "vitest";
import {
  greedyOptimizeUnderBudget,
  beamOptimizeUnderBudget,
  optimizeUnderBudget,
} from "./budgetOptimize";
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

const maxStats: HiscoreData = {
  skills: ["Attack", "Strength", "Defence", "Ranged", "Magic", "Hitpoints", "Prayer"].map(
    (name, id) => ({ id, name, rank: 1, level: 99, xp: 13_034_431 })
  ),
  activities: [],
};

const catalog: WikiEquipment[] = [
  item("Dragon scimitar", "weapon", {
    attackSlash: 67,
    strengthBonus: 66,
    attackSpeed: 4,
    combatStyle: "slash",
  }),
  item("Abyssal whip", "weapon", {
    attackSlash: 82,
    strengthBonus: 82,
    attackSpeed: 4,
    combatStyle: "slash",
  }),
  item("Ghrazi rapier", "weapon", {
    attackStab: 94,
    strengthBonus: 89,
    attackSpeed: 4,
    combatStyle: "stab",
  }),
  item("Amulet of glory", "neck", { attackSlash: 10, strengthBonus: 6 }),
  item("Amulet of torture", "neck", { attackSlash: 15, strengthBonus: 10 }),
  item("Rune full helm", "head"),
  item("Helm of neitiznot", "head", { strengthBonus: 3 }),
  item("Torva full helm", "head", { strengthBonus: 8 }),
  item("Dragon boots", "feet", { strengthBonus: 4 }),
  item("Primordial boots", "feet", { strengthBonus: 5 }),
];

const prices: Record<string, number> = {
  "dragon scimitar": 60_000,
  "abyssal whip": 1_500_000,
  "ghrazi rapier": 150_000_000,
  "amulet of glory": 12_000,
  "amulet of torture": 20_000_000,
  "rune full helm": 20_000,
  "helm of neitiznot": 50_000,
  "torva full helm": 200_000_000,
  "dragon boots": 100_000,
  "primordial boots": 30_000_000,
};

const commonOpts = {
  equipment: catalog,
  priceOf: (n: string) => prices[n.toLowerCase()] ?? null,
  hiscores: maxStats,
  target: { name: "Dummy", defLevel: 50, defBonus: 0, hp: 100 },
  style: "melee" as const,
};

describe("greedyOptimizeUnderBudget", () => {
  it("stays under budget and beats empty hands", () => {
    const r = greedyOptimizeUnderBudget({
      ...commonOpts,
      budget: 5_000_000,
    });
    expect(r).not.toBeNull();
    expect(r!.totalCost).toBeLessThanOrEqual(5_000_000);
    expect(r!.dps).toBeGreaterThan(0);
    // Should pick whip not rapier under 5M
    expect(r!.gear.weapon?.name).toBe("Abyssal whip");
    expect(r!.gear["2h"]).toBeUndefined();
  });

  it("picks expensive BiS when budget allows", () => {
    const r = greedyOptimizeUnderBudget({
      ...commonOpts,
      budget: 0, // unlimited
    });
    expect(r).not.toBeNull();
    expect(r!.gear.weapon?.name ?? r!.gear["2h"]?.name).toMatch(/Ghrazi|whip/i);
  });
});

describe("beamOptimizeUnderBudget", () => {
  it("stays under budget and returns positive DPS", () => {
    const r = beamOptimizeUnderBudget({
      ...commonOpts,
      budget: 5_000_000,
    });
    expect(r).not.toBeNull();
    expect(r!.totalCost).toBeLessThanOrEqual(5_000_000);
    expect(r!.dps).toBeGreaterThan(0);
    expect((r!.preset.description ?? "").toLowerCase()).toMatch(/beam|greedy/);
  });

  it("matches or beats greedy DPS under the same budget", () => {
    const greedy = greedyOptimizeUnderBudget({ ...commonOpts, budget: 2_000_000 });
    const beam = beamOptimizeUnderBudget({ ...commonOpts, budget: 2_000_000 });
    expect(beam).not.toBeNull();
    expect(greedy).not.toBeNull();
    expect(beam!.dps).toBeGreaterThanOrEqual(greedy!.dps - 0.01);
  });

  /**
   * Classic greedy trap: a slightly better expensive weapon can leave too little
   * cash for a high-str amulet. Beam keeps the cheap weapon seed and wins.
   */
  it("can pick cheaper weapon to afford better armour", () => {
    const trapCatalog: WikiEquipment[] = [
      item("Budget blade", "weapon", {
        attackSlash: 70,
        strengthBonus: 70,
        attackSpeed: 4,
        combatStyle: "slash",
      }),
      item("Pricey blade", "weapon", {
        attackSlash: 72,
        strengthBonus: 71,
        attackSpeed: 4,
        combatStyle: "slash",
      }),
      item("Power amulet", "neck", { attackSlash: 20, strengthBonus: 20 }),
    ];
    const trapPrices: Record<string, number> = {
      "budget blade": 100_000,
      "pricey blade": 900_000,
      "power amulet": 500_000,
    };
    const opts = {
      equipment: trapCatalog,
      priceOf: (n: string) => trapPrices[n.toLowerCase()] ?? null,
      hiscores: maxStats,
      target: { name: "Dummy", defLevel: 20, defBonus: 0, hp: 100 },
      budget: 1_000_000,
      style: "melee" as const,
    };
    const beam = beamOptimizeUnderBudget(opts);
    expect(beam).not.toBeNull();
    // Optimal is budget blade + power amulet (600k) over pricey alone (900k)
    expect(beam!.gear.weapon?.name).toBe("Budget blade");
    expect(beam!.gear.neck?.name).toBe("Power amulet");
    expect(beam!.totalCost).toBeLessThanOrEqual(1_000_000);
  });

  it("optimizeUnderBudget returns a usable loadout", () => {
    const r = optimizeUnderBudget({ ...commonOpts, budget: 10_000_000 });
    expect(r).not.toBeNull();
    expect(r!.dps).toBeGreaterThan(0);
  });
});
