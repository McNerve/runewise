import { describe, it, expect } from "vitest";
import {
  greedyOptimizeUnderBudget,
  beamOptimizeUnderBudget,
  combinatorialOptimizeUnderBudget,
  optimizeUnderBudget,
  paretoFilterCandidates,
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
    expect((r!.preset.description ?? "").toLowerCase()).toMatch(/beam|greedy|combinatorial/);
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

describe("owned and exclude constraints", () => {
  it("treats owned expensive items as free so they fit tight budgets", () => {
    const r = optimizeUnderBudget({
      ...commonOpts,
      budget: 100_000, // whip is 1.5M normally
      ownedItems: ["Abyssal whip"],
    });
    expect(r).not.toBeNull();
    expect(r!.gear.weapon?.name).toBe("Abyssal whip");
    expect(r!.totalCost).toBeLessThanOrEqual(100_000);
    expect(r!.unpricedCount).toBe(0);
  });

  it("does not treat unpriced BiS as free under a capped budget", () => {
    const god = item("God blade", "weapon", {
      attackSlash: 200,
      strengthBonus: 200,
      attackSpeed: 4,
      combatStyle: "slash",
    });
    const r = optimizeUnderBudget({
      ...commonOpts,
      equipment: [...catalog, god],
      budget: 5_000_000,
    });
    expect(r).not.toBeNull();
    const w = r!.gear.weapon?.name ?? r!.gear["2h"]?.name ?? "";
    expect(w).not.toBe("God blade");
    expect(w).toMatch(/whip|scimitar|rapier/i);
  });

  it("allows unpriced BiS when budget is unlimited", () => {
    const god = item("God blade", "weapon", {
      attackSlash: 200,
      strengthBonus: 200,
      attackSpeed: 4,
      combatStyle: "slash",
    });
    const r = optimizeUnderBudget({
      ...commonOpts,
      equipment: [...catalog, god],
      budget: 0,
    });
    expect(r).not.toBeNull();
    expect(r!.gear.weapon?.name ?? r!.gear["2h"]?.name).toBe("God blade");
  });

  it("still equips an owned unpriced item under a capped budget", () => {
    const god = item("God blade", "weapon", {
      attackSlash: 200,
      strengthBonus: 200,
      attackSpeed: 4,
      combatStyle: "slash",
    });
    const r = optimizeUnderBudget({
      ...commonOpts,
      equipment: [...catalog, god],
      budget: 100_000,
      ownedItems: ["God blade"],
    });
    expect(r).not.toBeNull();
    expect(r!.gear.weapon?.name ?? r!.gear["2h"]?.name).toBe("God blade");
    expect(r!.totalCost).toBeLessThanOrEqual(100_000);
    expect(r!.unpricedCount).toBe(0);
  });

  it("never equips excluded weapons", () => {
    const r = optimizeUnderBudget({
      ...commonOpts,
      budget: 0,
      excludeItems: ["Ghrazi rapier", "Abyssal whip"],
    });
    expect(r).not.toBeNull();
    const w = r!.gear.weapon?.name ?? r!.gear["2h"]?.name ?? "";
    expect(w).not.toMatch(/rapier|whip/i);
  });
});

describe("paretoFilterCandidates", () => {
  it("drops strictly dominated (worse offense, higher cost) items", () => {
    const front = paretoFilterCandidates(
      [
        { item: item("A", "neck", { strengthBonus: 10 }), cost: 100, offense: 10 },
        { item: item("B", "neck", { strengthBonus: 5 }), cost: 200, offense: 5 },
        { item: item("C", "neck", { strengthBonus: 12 }), cost: 150, offense: 12 },
        { item: item("D", "neck", { strengthBonus: 12 }), cost: 300, offense: 12 },
      ],
      10
    );
    const names = front.map((c) => c.item.name);
    expect(names).toContain("C");
    expect(names).not.toContain("B"); // worse offense, higher cost than A
    expect(names).not.toContain("D"); // same offense as C, higher cost
  });
});

describe("combinatorialOptimizeUnderBudget", () => {
  it("stays under budget and beats empty hands", () => {
    const r = combinatorialOptimizeUnderBudget({
      ...commonOpts,
      budget: 5_000_000,
    });
    expect(r).not.toBeNull();
    expect(r!.totalCost).toBeLessThanOrEqual(5_000_000);
    expect(r!.dps).toBeGreaterThan(0);
    expect((r!.preset.description ?? "").toLowerCase()).toMatch(/combinatorial|beam|greedy/);
  });

  it("matches or beats beam under the same budget", () => {
    const beam = beamOptimizeUnderBudget({ ...commonOpts, budget: 2_000_000 });
    const combo = combinatorialOptimizeUnderBudget({ ...commonOpts, budget: 2_000_000 });
    expect(combo).not.toBeNull();
    expect(beam).not.toBeNull();
    expect(combo!.dps).toBeGreaterThanOrEqual(beam!.dps - 0.01);
  });

  /**
   * Multi-slot greedy trap: best solo weapon + best solo body leaves no room
   * for the high-value amulet. Optimal spends on mid weapon + body + amulet.
   */
  it("solves multi-slot budget tradeoffs greedy/beam may miss", () => {
    const trap: WikiEquipment[] = [
      item("Mid blade", "weapon", {
        attackSlash: 75,
        strengthBonus: 75,
        attackSpeed: 4,
        combatStyle: "slash",
      }),
      item("Top blade", "weapon", {
        attackSlash: 90,
        strengthBonus: 88,
        attackSpeed: 4,
        combatStyle: "slash",
      }),
      item("Mid body", "body", { attackSlash: 5, strengthBonus: 5 }),
      item("Top body", "body", { attackSlash: 8, strengthBonus: 8 }),
      item("God amulet", "neck", { attackSlash: 25, strengthBonus: 25 }),
    ];
    const trapPrices: Record<string, number> = {
      "mid blade": 200_000,
      "top blade": 800_000,
      "mid body": 150_000,
      "top body": 400_000,
      "god amulet": 350_000,
    };
    const opts = {
      equipment: trap,
      priceOf: (n: string) => trapPrices[n.toLowerCase()] ?? null,
      hiscores: maxStats,
      target: { name: "Dummy", defLevel: 30, defBonus: 0, hp: 120 },
      budget: 700_000,
      style: "melee" as const,
    };
    // Optimal path: mid blade (200) + mid body (150) + god amulet (350) = 700
    // Top blade alone is 800 — over budget. Top blade + anything fails.
    // Top body + mid blade = 600, no amulet room for 350.
    const combo = combinatorialOptimizeUnderBudget(opts);
    expect(combo).not.toBeNull();
    expect(combo!.totalCost).toBeLessThanOrEqual(700_000);
    expect(combo!.gear.weapon?.name).toBe("Mid blade");
    expect(combo!.gear.neck?.name).toBe("God amulet");
    // Body optional but if present should be mid (top + amulet + mid blade = 950 > budget)
    if (combo!.gear.body) {
      expect(combo!.gear.body.name).toBe("Mid body");
    }
    const greedy = greedyOptimizeUnderBudget(opts);
    expect(combo!.dps).toBeGreaterThanOrEqual(greedy!.dps - 0.01);
  });

  it("prefers rapier stab bonus over slash-default when scoring", () => {
    // Rapier is pure stab; if we wrongly score as slash, its attack is 0 and loses to scim
    const cat: WikiEquipment[] = [
      item("Toy scimitar", "weapon", {
        attackSlash: 50,
        strengthBonus: 50,
        attackSpeed: 4,
        combatStyle: "slash",
      }),
      item("Toy rapier", "weapon", {
        attackStab: 80,
        strengthBonus: 55,
        attackSpeed: 4,
        combatStyle: "stab",
      }),
    ];
    const prices: Record<string, number> = {
      "toy scimitar": 1_000,
      "toy rapier": 1_000,
    };
    const r = combinatorialOptimizeUnderBudget({
      equipment: cat,
      priceOf: (n) => prices[n.toLowerCase()] ?? null,
      hiscores: maxStats,
      target: { name: "Dummy", defLevel: 80, defBonus: 100, hp: 100 },
      budget: 10_000,
      style: "melee",
    });
    expect(r).not.toBeNull();
    // High def target: accuracy from stab 80 should beat slash 50
    expect(r!.gear.weapon?.name).toBe("Toy rapier");
  });
});
