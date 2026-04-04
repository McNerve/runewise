import { describe, it, expect } from "vitest";
import { checkQuestEligibility, checkAllQuests } from "./questEligibility";
import type { Quest } from "../data/quests";
import type { HiscoreData } from "../api/hiscores";

function makeHiscores(skills: Record<string, number>): HiscoreData {
  return {
    skills: Object.entries(skills).map(([name, level], i) => ({
      id: i,
      name,
      rank: 1,
      level,
      xp: 0,
    })),
    activities: [],
  };
}

const testQuest: Quest = {
  name: "Dragon Slayer",
  difficulty: "Experienced",
  length: "Long",
  questPoints: 2,
  members: false,
  skillRequirements: [
    { skill: "Mining", level: 60 },
    { skill: "Smithing", level: 70 },
    { skill: "Agility", level: 50 },
  ],
  questRequirements: [],
};

describe("checkQuestEligibility", () => {
  it("all requirements met = ready", () => {
    const hiscores = makeHiscores({ Mining: 70, Smithing: 80, Agility: 60 });
    const result = checkQuestEligibility(testQuest, hiscores);
    expect(result.status).toBe("ready");
    expect(result.metRequirements).toBe(3);
    expect(result.totalRequirements).toBe(3);
    expect(result.unmetSkills).toHaveLength(0);
    expect(result.maxGap).toBe(0);
  });

  it("exact level meets requirement", () => {
    const hiscores = makeHiscores({ Mining: 60, Smithing: 70, Agility: 50 });
    const result = checkQuestEligibility(testQuest, hiscores);
    expect(result.status).toBe("ready");
    expect(result.metRequirements).toBe(3);
  });

  it("one skill short by <= 5 = almost", () => {
    const hiscores = makeHiscores({ Mining: 60, Smithing: 66, Agility: 50 });
    const result = checkQuestEligibility(testQuest, hiscores);
    expect(result.status).toBe("almost");
    expect(result.metRequirements).toBe(2);
    expect(result.unmetSkills).toHaveLength(1);
    expect(result.unmetSkills[0].skill).toBe("Smithing");
    expect(result.unmetSkills[0].gap).toBe(4);
    expect(result.maxGap).toBe(4);
  });

  it("one skill short by > 5 = locked", () => {
    const hiscores = makeHiscores({ Mining: 60, Smithing: 50, Agility: 50 });
    const result = checkQuestEligibility(testQuest, hiscores);
    expect(result.status).toBe("locked");
    expect(result.unmetSkills).toHaveLength(1);
    expect(result.unmetSkills[0].gap).toBe(20);
    expect(result.maxGap).toBe(20);
  });

  it("no requirements = ready", () => {
    const quest: Quest = {
      name: "Cook's Assistant",
      difficulty: "Novice",
      length: "Short",
      questPoints: 1,
      members: false,
      skillRequirements: [],
      questRequirements: [],
    };
    const hiscores = makeHiscores({});
    const result = checkQuestEligibility(quest, hiscores);
    expect(result.status).toBe("ready");
    expect(result.metRequirements).toBe(0);
    expect(result.totalRequirements).toBe(0);
  });

  it("missing skill in hiscores defaults to level 1", () => {
    const hiscores = makeHiscores({ Mining: 60, Smithing: 70 });
    // Agility not in hiscores — defaults to 1, gap = 49
    const result = checkQuestEligibility(testQuest, hiscores);
    expect(result.status).toBe("locked");
    expect(result.unmetSkills.find((s) => s.skill === "Agility")?.current).toBe(1);
    expect(result.unmetSkills.find((s) => s.skill === "Agility")?.gap).toBe(49);
  });

  it("multiple unmet skills, maxGap is the largest", () => {
    const hiscores = makeHiscores({ Mining: 30, Smithing: 40, Agility: 48 });
    const result = checkQuestEligibility(testQuest, hiscores);
    expect(result.status).toBe("locked");
    expect(result.unmetSkills).toHaveLength(3);
    expect(result.maxGap).toBe(30); // Mining: 60 - 30 = 30
  });

  it("gap of exactly 5 = almost", () => {
    const hiscores = makeHiscores({ Mining: 55, Smithing: 70, Agility: 50 });
    const result = checkQuestEligibility(testQuest, hiscores);
    expect(result.status).toBe("almost");
    expect(result.maxGap).toBe(5);
  });

  it("gap of exactly 6 = locked", () => {
    const hiscores = makeHiscores({ Mining: 54, Smithing: 70, Agility: 50 });
    const result = checkQuestEligibility(testQuest, hiscores);
    expect(result.status).toBe("locked");
    expect(result.maxGap).toBe(6);
  });
});

describe("checkAllQuests", () => {
  it("returns eligibility for all quests", () => {
    const quests: Quest[] = [
      testQuest,
      {
        name: "Simple Quest",
        difficulty: "Novice",
        length: "Short",
        questPoints: 1,
        members: false,
        skillRequirements: [{ skill: "Attack", level: 10 }],
        questRequirements: [],
      },
    ];
    const hiscores = makeHiscores({ Mining: 99, Smithing: 99, Agility: 99, Attack: 99 });
    const results = checkAllQuests(quests, hiscores);
    expect(results).toHaveLength(2);
    expect(results[0].status).toBe("ready");
    expect(results[1].status).toBe("ready");
  });
});
