import { describe, it, expect } from "vitest";
import { nearestMilestones, MAX_SKILL_XP } from "./milestones";
import { xpForLevel } from "./xp";
import type { HiscoreData, HiscoreSkill } from "../api/hiscores";

function skill(name: string, level: number, xp: number): HiscoreSkill {
  return { id: 0, name, rank: 1, level, xp };
}
function hs(skills: HiscoreSkill[]): HiscoreData {
  return { skills, activities: [] };
}

describe("nearestMilestones", () => {
  it("targets the next notable milestone above the current level", () => {
    const xp68 = xpForLevel(68);
    const [m] = nearestMilestones(hs([skill("Mining", 68, xp68)]));
    expect(m.label).toBe("Level 70");
    expect(m.target).toBe(70);
    expect(m.xpToGo).toBe(xpForLevel(70) - xp68);
    expect(m.isMaxXp).toBe(false);
  });

  it("ranks skills by least XP remaining", () => {
    const ms = nearestMilestones(
      hs([
        skill("Mining", 68, xpForLevel(68)), // far from 70
        skill("Cooking", 69, xpForLevel(70) - 5), // 5 xp from 70
      ])
    );
    expect(ms.map((m) => m.skill.name)).toEqual(["Cooking", "Mining"]);
  });

  it("switches a 99 skill to the 200M XP goal", () => {
    const [m] = nearestMilestones(hs([skill("Attack", 99, 50_000_000)]));
    expect(m.label).toBe("200M XP");
    expect(m.isMaxXp).toBe(true);
    expect(m.xpToGo).toBe(MAX_SKILL_XP - 50_000_000);
  });

  it("excludes maxed (200M) skills and the Overall row", () => {
    const ms = nearestMilestones(
      hs([
        skill("Overall", 99, 999_000_000),
        skill("Attack", 99, MAX_SKILL_XP),
      ])
    );
    expect(ms).toHaveLength(0);
  });

  it("respects the count cap", () => {
    const skills = ["a", "b", "c", "d"].map((n, i) => skill(n, 50 + i, xpForLevel(50 + i)));
    expect(nearestMilestones(hs(skills), 2)).toHaveLength(2);
  });

  it("skips untrained level-1 skills and base Hitpoints", () => {
    const ms = nearestMilestones(
      hs([
        skill("Ranged", 1, 0),
        skill("Hitpoints", 10, xpForLevel(10)),
        skill("Mining", 50, xpForLevel(50)),
      ])
    );
    expect(ms.map((m) => m.skill.name)).toEqual(["Mining"]);
    expect(ms[0]!.label).toBe("Level 60");
  });
});
