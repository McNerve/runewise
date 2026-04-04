import { describe, it, expect } from "vitest";
import { parseHiscoreData } from "./validators";

describe("parseHiscoreData", () => {
  it("parses valid hiscore data", () => {
    const input = {
      skills: [
        { id: 0, name: "Overall", rank: 500000, level: 1500, xp: 50000000 },
        { id: 1, name: "Attack", rank: 100000, level: 99, xp: 13034431 },
      ],
      activities: [
        { id: 0, name: "Clue Scrolls (all)", rank: 5000, score: 200 },
      ],
    };
    const result = parseHiscoreData(input);
    expect(result.skills).toHaveLength(2);
    expect(result.skills[0]).toEqual({
      id: 0,
      name: "Overall",
      rank: 500000,
      level: 1500,
      xp: 50000000,
    });
    expect(result.activities).toHaveLength(1);
    expect(result.activities[0]).toEqual({
      id: 0,
      name: "Clue Scrolls (all)",
      rank: 5000,
      score: 200,
    });
  });

  it("throws on non-object input", () => {
    expect(() => parseHiscoreData(null)).toThrow("Unexpected Hiscores response");
    expect(() => parseHiscoreData("string")).toThrow("Unexpected Hiscores response");
    expect(() => parseHiscoreData(42)).toThrow("Unexpected Hiscores response");
    expect(() => parseHiscoreData(undefined)).toThrow("Unexpected Hiscores response");
  });

  it("handles missing skills/activities arrays gracefully", () => {
    const result = parseHiscoreData({});
    expect(result.skills).toEqual([]);
    expect(result.activities).toEqual([]);
  });

  it("filters out non-object entries in skills array", () => {
    const input = {
      skills: [
        { id: 0, name: "Attack", rank: 1, level: 99, xp: 13034431 },
        "not an object",
        42,
        null,
        { id: 1, name: "Strength", rank: 2, level: 80, xp: 2000000 },
      ],
      activities: [],
    };
    const result = parseHiscoreData(input);
    expect(result.skills).toHaveLength(2);
    expect(result.skills[0].name).toBe("Attack");
    expect(result.skills[1].name).toBe("Strength");
  });

  it("uses fallback values for missing fields", () => {
    const input = {
      skills: [{}],
      activities: [{}],
    };
    const result = parseHiscoreData(input);
    expect(result.skills[0]).toEqual({
      id: 0,
      name: "Skill 1",
      rank: -1,
      level: 1,
      xp: 0,
    });
    expect(result.activities[0]).toEqual({
      id: 0,
      name: "Activity 1",
      rank: -1,
      score: 0,
    });
  });

  it("handles NaN and Infinity as non-finite numbers", () => {
    const input = {
      skills: [{ id: NaN, name: "Test", rank: Infinity, level: -Infinity, xp: NaN }],
      activities: [],
    };
    const result = parseHiscoreData(input);
    expect(result.skills[0].id).toBe(0); // fallback index
    expect(result.skills[0].rank).toBe(-1); // fallback
    expect(result.skills[0].level).toBe(1); // fallback
    expect(result.skills[0].xp).toBe(0); // fallback
  });

  it("preserves valid numeric values including zero", () => {
    const input = {
      skills: [{ id: 0, name: "Test", rank: 0, level: 0, xp: 0 }],
      activities: [],
    };
    const result = parseHiscoreData(input);
    expect(result.skills[0].id).toBe(0);
    expect(result.skills[0].rank).toBe(0);
    expect(result.skills[0].level).toBe(0);
    expect(result.skills[0].xp).toBe(0);
  });

  it("uses index as fallback id when id is not a number", () => {
    const input = {
      skills: [
        { name: "First" },
        { name: "Second" },
      ],
      activities: [],
    };
    const result = parseHiscoreData(input);
    expect(result.skills[0].id).toBe(0);
    expect(result.skills[1].id).toBe(1);
  });
});
