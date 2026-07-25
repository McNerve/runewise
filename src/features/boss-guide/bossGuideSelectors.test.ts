import { describe, it, expect } from "vitest";
import type { HiscoreData } from "../../lib/api/hiscores";
import type { BossInfo } from "../../lib/data/bosses";
import {
  buildItemMaps,
  computeDropCategoryCount,
  computeLootRows,
  computeLootTotals,
  getBossKc,
  getBossTasks,
  groupTasksByTier,
  raidTopUniqueName,
  TASK_ALIASES,
} from "./bossGuideSelectors";

function boss(partial: Partial<BossInfo> & { name: string }): BossInfo {
  return {
    wikiPage: partial.name,
    category: "Other",
    ...partial,
  };
}

describe("getBossKc", () => {
  const hiscores: HiscoreData = {
    skills: [],
    activities: [
      { id: 1, name: "Zulrah", rank: 1, score: 42 },
      { id: 2, name: "Vorkath", rank: 2, score: 0 },
      { id: 3, name: "Theatre of Blood", rank: 3, score: 100 },
      { id: 4, name: "Theatre of Blood: Hard Mode", rank: 4, score: 25 },
      { id: 5, name: "Chambers of Xeric", rank: 5, score: 200 },
      { id: 6, name: "Chambers of Xeric: Challenge Mode", rank: 6, score: 15 },
      { id: 7, name: "Tombs of Amascut", rank: 7, score: 80 },
      { id: 8, name: "Tombs of Amascut: Expert Mode", rank: 8, score: 12 },
    ],
  };

  it("returns null without boss or activities", () => {
    expect(getBossKc(null, boss({ name: "Zulrah" }))).toBeNull();
    expect(getBossKc(hiscores, null)).toBeNull();
  });

  it("matches by name and ignores zero scores", () => {
    expect(getBossKc(hiscores, boss({ name: "Zulrah" }))).toBe(42);
    expect(getBossKc(hiscores, boss({ name: "Vorkath" }))).toBeNull();
  });

  it("uses hiscoresName alternate", () => {
    expect(
      getBossKc(hiscores, boss({ name: "Snek", hiscoresName: "Zulrah" }))
    ).toBe(42);
  });

  it("does not attribute normal-mode KC to Hard/Challenge/Expert variants", () => {
    expect(
      getBossKc(hiscores, boss({ name: "Theatre of Blood: Hard Mode" }))
    ).toBe(25);
    expect(
      getBossKc(hiscores, boss({ name: "Chambers of Xeric: Challenge Mode" }))
    ).toBe(15);
    expect(
      getBossKc(hiscores, boss({ name: "Tombs of Amascut: Expert Mode" }))
    ).toBe(12);
  });

  it("still matches base raid names exactly", () => {
    expect(getBossKc(hiscores, boss({ name: "Theatre of Blood" }))).toBe(100);
    expect(getBossKc(hiscores, boss({ name: "Chambers of Xeric" }))).toBe(200);
  });
});

describe("getBossTasks / groupTasksByTier", () => {
  it("maps Dagannoth Rex tasks via alias", () => {
    expect(TASK_ALIASES["Dagannoth Rex"]).toContain("Dagannoth Kings");
    const tasks = getBossTasks(boss({ name: "Dagannoth Rex" }));
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.every((t) => t.boss === "Dagannoth Kings" || t.boss.includes("Dagannoth"))).toBe(
      true
    );
  });

  it("groups non-empty tiers only", () => {
    const tasks = getBossTasks(boss({ name: "Zulrah" }));
    const groups = groupTasksByTier(tasks);
    expect(groups.every((g) => g.tasks.length > 0)).toBe(true);
    for (const g of groups) {
      expect(g.tasks.every((t) => t.tier === g.tier)).toBe(true);
    }
  });
});

describe("loot math", () => {
  it("computes EV per kill and per hour", () => {
    const rows = computeLootRows(
      {
        bossName: "Test",
        killsPerHour: 20,
        drops: [
          {
            itemId: 1,
            itemName: "A",
            quantity: 1,
            rate: 10,
            category: "unique",
          },
        ],
      },
      { "1": { high: 1000, low: 1000, highTime: null, lowTime: null } },
      20
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.evPerKill).toBe(100);
    expect(rows[0]!.evPerHr).toBe(2000);
    expect(computeLootTotals(rows)).toEqual({ perKill: 100, perHour: 2000 });
  });

  it("uses raid category count when tables empty", () => {
    expect(
      computeDropCategoryCount([], null, boss({ name: "Chambers of Xeric" }))
    ).toBe(2);
    expect(computeDropCategoryCount([], null, boss({ name: "Zulrah" }))).toBeNull();
  });
});

describe("buildItemMaps / raidTopUniqueName", () => {
  it("indexes mapping by lowercase name", () => {
    const { itemMap, iconMap } = buildItemMaps([
      { name: "Twisted bow", id: 20997, icon: "Twisted_bow.png" },
    ]);
    expect(itemMap.get("twisted bow")).toBe(20997);
    expect(iconMap.get("twisted bow")).toBe("Twisted_bow.png");
  });

  it("returns first unique name", () => {
    expect(raidTopUniqueName({ uniques: [{ name: "Dexterous prayer scroll" } as never] })).toBe(
      "Dexterous prayer scroll"
    );
    expect(raidTopUniqueName(null)).toBeNull();
  });
});
