import { describe, it, expect } from "vitest";
import { checkRequirements } from "./questRequirements";
import type { Quest } from "../../lib/data/quests";
import type { HiscoreData } from "../../lib/api/hiscores";

const quest: Quest = {
  name: "Test Quest",
  difficulty: "Novice",
  length: "Short",
  questPoints: 1,
  members: false,
  skillRequirements: [{ skill: "Attack", level: 50 }],
  questRequirements: [],
};

const noReqs: Quest = {
  ...quest,
  name: "No Reqs",
  skillRequirements: [],
};

function hiscores(level: number): HiscoreData {
  return {
    skills: [{ id: 0, name: "Attack", rank: 1, level, xp: 0 }],
    activities: [],
  };
}

describe("checkRequirements", () => {
  it("returns unknown (not met) when hiscores are null", () => {
    const r = checkRequirements(quest, null);
    expect(r.status).toBe("unknown");
    expect(r.met).toBe(false);
    expect(r.missing).toEqual([]);
  });

  it("marks quests with no skill reqs as met when hiscores exist", () => {
    const r = checkRequirements(noReqs, hiscores(1));
    expect(r.status).toBe("met");
    expect(r.met).toBe(true);
  });

  it("detects missing and met requirements", () => {
    expect(checkRequirements(quest, hiscores(40)).status).toBe("missing");
    expect(checkRequirements(quest, hiscores(50)).status).toBe("met");
    expect(checkRequirements(quest, hiscores(40)).missing[0]).toMatchObject({
      skill: "Attack",
      required: 50,
      current: 40,
    });
  });
});
