import { describe, it, expect } from "vitest";
import { buildWhatNext } from "./whatNext";
import type { HiscoreData } from "./api/hiscores";

function fakeHiscores(levels: Record<string, number>): HiscoreData {
  const skills = Object.entries(levels).map(([name, level], i) => ({
    id: i,
    name,
    rank: 1,
    level,
    xp: level * level * 100,
  }));
  // Ensure Overall exists
  if (!levels.Overall) {
    skills.unshift({
      id: 0,
      name: "Overall",
      rank: 1,
      level: Object.values(levels).reduce((a, b) => a + b, 0),
      xp: 50_000_000,
    });
  }
  return {
    skills,
    activities: [{ id: 25, name: "Zulrah", rank: 1, score: 50 }],
  } as HiscoreData;
}

describe("buildWhatNext", () => {
  it("prompts for RSN when no account is set", () => {
    const actions = buildWhatNext({ rsn: null, hiscores: null });
    expect(actions.some((a) => a.id === "set-rsn")).toBe(true);
    expect(actions.some((a) => a.view === "loadout-finder")).toBe(true);
    expect(actions.length).toBeLessThanOrEqual(3);
  });

  it("does not nag to set RSN when the name is already saved", () => {
    const actions = buildWhatNext({ rsn: "Raxor", hiscores: null, liveStarCount: 4 });
    expect(actions.some((a) => a.id === "set-rsn")).toBe(false);
    expect(actions.some((a) => a.id === "stars")).toBe(true);
  });

  it("surfaces live farm timers ahead of generic setup", () => {
    const actions = buildWhatNext({
      rsn: null,
      hiscores: null,
      activeFarmTimers: 2,
    });
    expect(actions[0]?.id).toBe("farm-timers");
  });

  it("suggests training, combat, and money for a mid-level main", () => {
    const data = fakeHiscores({
      Attack: 80,
      Strength: 85,
      Defence: 70,
      Hitpoints: 85,
      Prayer: 70,
      Ranged: 90,
      Magic: 94,
      Slayer: 75,
      Cooking: 70,
    });
    const actions = buildWhatNext({
      rsn: "Test",
      hiscores: data,
      ironmanMode: false,
    });
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.length).toBeLessThanOrEqual(3);
    expect(actions.some((a) => a.kind === "combat" || a.kind === "train" || a.kind === "money")).toBe(
      true
    );
  });

  it("avoids GE flip push for ironman mode", () => {
    const data = fakeHiscores({
      Attack: 99,
      Strength: 99,
      Defence: 99,
      Hitpoints: 99,
      Prayer: 99,
      Ranged: 99,
      Magic: 99,
      Slayer: 99,
    });
    const actions = buildWhatNext({
      rsn: "Iron",
      hiscores: data,
      ironmanMode: true,
    });
    expect(actions.every((a) => a.id !== "flips")).toBe(true);
  });
});
