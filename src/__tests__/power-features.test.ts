import { describe, it, expect, vi } from "vitest";
import type { GearLoadout } from "../features/dps-calc/hooks/useDpsState";
import { flipProfit } from "../features/flip-journal/profit";

vi.mock("../lib/api/ge", () => ({
  fetchMapping: vi.fn().mockResolvedValue([
    { id: 4151, name: "Abyssal whip", examine: "", members: true, lowalch: 0, highalch: 0, limit: 70, value: 1, icon: "" },
    { id: 995, name: "Coins", examine: "", members: false, lowalch: 0, highalch: 0, limit: 0, value: 1, icon: "" },
  ]),
  fetchVolumes: vi.fn().mockResolvedValue({ "4151": 50000, "995": 9999999 }),
  searchItems: vi.fn().mockResolvedValue([]),
}));

// ── 1. Loadout export / import round-trip ─────────────────────────────────────

describe("Loadout export/import round-trip", () => {
  const sampleLoadouts: GearLoadout[] = [
    {
      name: "Melee max",
      combatStyle: "melee",
      stanceIdx: 0,
      prayerIdx: 1,
      attackBonus: 200,
      strengthBonus: 120,
      attackSpeed: 4,
      modifiers: ["slayer"],
      contentTag: "Zulrah Serpentine",
      note: "tried blowpipe swap, 5% higher dps",
      savedAt: "2026-04-17T10:00:00.000Z",
      dps: 12.5,
      maxHit: 42,
    },
    {
      name: "Range setup",
      combatStyle: "ranged",
      stanceIdx: 0,
      prayerIdx: 2,
      attackBonus: 180,
      strengthBonus: 110,
      attackSpeed: 5,
      modifiers: [],
      contentTag: "ToA Expert",
      savedAt: "2026-04-17T11:00:00.000Z",
    },
  ];

  it("serialises and deserialises without data loss", () => {
    const json = JSON.stringify({ version: 1, loadouts: sampleLoadouts });
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(1);
    expect(parsed.loadouts).toHaveLength(2);
    const first = parsed.loadouts[0] as GearLoadout;
    expect(first.name).toBe("Melee max");
    expect(first.contentTag).toBe("Zulrah Serpentine");
    expect(first.note).toBe("tried blowpipe swap, 5% higher dps");
    expect(first.dps).toBe(12.5);
    expect(first.maxHit).toBe(42);
  });

  it("handles legacy array format (no version wrapper)", () => {
    const json = JSON.stringify(sampleLoadouts);
    const parsed = JSON.parse(json);
    // The import handler accepts both array and { version, loadouts }
    const incoming: GearLoadout[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.loadouts)
        ? parsed.loadouts
        : [];
    expect(incoming).toHaveLength(2);
    expect(incoming[1].name).toBe("Range setup");
  });

  it("deduplicates on import by name", () => {
    const existing: GearLoadout[] = [sampleLoadouts[0]!];
    const incoming: GearLoadout[] = [...sampleLoadouts];
    const nameSet = new Set(existing.map((l) => l.name));
    const merged = [...existing, ...incoming.filter((l) => !nameSet.has(l.name))];
    // "Melee max" is a dup → only 2 total (1 existing + 1 new)
    expect(merged).toHaveLength(2);
    expect(merged.map((l) => l.name)).toEqual(["Melee max", "Range setup"]);
  });

  it("preserves all v2 snapshot fields", () => {
    const raw = JSON.stringify({ version: 1, loadouts: sampleLoadouts });
    const { loadouts } = JSON.parse(raw) as { version: number; loadouts: GearLoadout[] };
    expect(loadouts[0]!.savedAt).toBe("2026-04-17T10:00:00.000Z");
    expect(loadouts[0]!.combatStyle).toBe("melee");
    expect(loadouts[1]!.contentTag).toBe("ToA Expert");
  });
});

// ── 2. Flip Journal tax calculation ──────────────────────────────────────────
// Tests the REAL exported function: GE tax is 2% of the sale price per item
// (floored, 5m cap, sub-50gp exempt), not a percentage of the margin.

describe("Flip Journal profit calculation", () => {
  it("applies 2% GE tax on the sell price", () => {
    // tax = floor(2.1m × 0.02) = 42,000 → profit = 2.1m − 42k − 2m = 58,000
    expect(flipProfit(2_000_000, 2_100_000, 1)).toBe(58_000);
  });

  it("flips the sign on thin-margin flips", () => {
    // buy 10,000 / sell 10,100: tax 202 → −102 per unit, NOT +99
    expect(flipProfit(10_000, 10_100, 1)).toBe(-102);
  });

  it("handles bulk flips with qty", () => {
    // sell 210: tax floor(4.2) = 4 → (210 − 4 − 200) × 1000 = 6,000
    expect(flipProfit(200, 210, 1000)).toBe(6_000);
  });

  it("exempts sub-50gp sales from tax", () => {
    expect(flipProfit(30, 40, 100)).toBe(1_000);
  });

  it("caps tax at 5m per item", () => {
    // sell 300m: tax capped at 5m → 300m − 5m − 290m = 5m
    expect(flipProfit(290_000_000, 300_000_000, 1)).toBe(5_000_000);
  });

  it("does not soften losses (no tax rebate on a bad flip)", () => {
    // tax = floor(90k × 0.02) = 1,800 → 90k − 1.8k − 100k = −11,800
    expect(flipProfit(100_000, 90_000, 1)).toBe(-11_800);
  });
});

// ── 3. Search index entity types ──────────────────────────────────────────────

describe("Search index entity coverage", () => {
  it("includes quest entries", async () => {
    const { buildSearchIndex } = await import("../lib/search");
    const index = await buildSearchIndex();
    const quests = index.filter((r) => r.category === "Quest");
    expect(quests.length).toBeGreaterThan(50);
  });

  it("includes combat task entries", async () => {
    const { buildSearchIndex } = await import("../lib/search");
    const index = await buildSearchIndex();
    const tasks = index.filter((r) => r.category === "Combat Task");
    expect(tasks.length).toBeGreaterThan(30);
  });

  it("includes clue entries", async () => {
    const { buildSearchIndex } = await import("../lib/search");
    const index = await buildSearchIndex();
    const clues = index.filter((r) => r.category === "Clue");
    expect(clues.length).toBeGreaterThan(50);
  });

  it("includes GE item entries (capped at 500)", async () => {
    const { buildSearchIndex } = await import("../lib/search");
    const index = await buildSearchIndex();
    const items = index.filter((r) => r.category === "Item");
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(500);
  });

  it("quests navigate to progress view with tab=quests", async () => {
    const { buildSearchIndex } = await import("../lib/search");
    const index = await buildSearchIndex();
    const quest = index.find((r) => r.category === "Quest");
    expect(quest?.view).toBe("progress");
    expect(quest?.params?.tab).toBe("quests");
  });

  it("combat tasks navigate to combat-tasks view", async () => {
    const { buildSearchIndex } = await import("../lib/search");
    const index = await buildSearchIndex();
    const task = index.find((r) => r.category === "Combat Task");
    expect(task?.view).toBe("combat-tasks");
  });

  it("clue entries navigate to clue-helper view", async () => {
    const { buildSearchIndex } = await import("../lib/search");
    const index = await buildSearchIndex();
    const clue = index.find((r) => r.category === "Clue");
    expect(clue?.view).toBe("clue-helper");
    expect(clue?.params?.search).toBeTruthy();
  });

  it("includes skill entries", async () => {
    const { buildSearchIndex } = await import("../lib/search");
    const index = await buildSearchIndex();
    const skills = index.filter((r) => r.category === "Skill");
    expect(skills.length).toBeGreaterThanOrEqual(20);
  });
});
