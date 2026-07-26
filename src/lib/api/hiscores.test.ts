import { describe, it, expect } from "vitest";
import { findActivityScore, getSkillLevel, getSkillXp, type HiscoreData } from "./hiscores";

const mk = (activities: { name: string; score: number }[]): HiscoreData => ({
  skills: [],
  activities: activities.map((a, i) => ({ id: i, rank: 1, ...a })),
});

describe("getSkillLevel aliases", () => {
  const data: HiscoreData = {
    skills: [
      { id: 0, name: "Attack", rank: 1, level: 90, xp: 5_000_000 },
      { id: 1, name: "Range", rank: 1, level: 88, xp: 4_000_000 },
      { id: 2, name: "Hitpoints", rank: 1, level: 95, xp: 9_000_000 },
      { id: 3, name: "Defence", rank: 1, level: 80, xp: 2_000_000 },
    ],
    activities: [],
  };

  it("matches canonical and alias names", () => {
    expect(getSkillLevel(data, "Attack")).toBe(90);
    expect(getSkillLevel(data, "Ranged")).toBe(88); // alias for "Range"
    expect(getSkillLevel(data, "Range")).toBe(88);
    expect(getSkillLevel(data, "Defense")).toBe(80); // US spelling
    expect(getSkillLevel(data, "HP")).toBe(95);
  });

  it("uses fallback when missing or null data", () => {
    expect(getSkillLevel(data, "Magic", 99)).toBe(99);
    expect(getSkillLevel(null, "Attack", 99)).toBe(99);
    expect(getSkillXp(data, "Attack")).toBe(5_000_000);
    expect(getSkillXp(null, "Attack", 0)).toBe(0);
  });
});

describe("findActivityScore", () => {
  it("exact case-insensitive match", () => {
    expect(findActivityScore(mk([{ name: "Zulrah", score: 42 }]), "Zulrah")).toBe(42);
    expect(findActivityScore(mk([{ name: "Zulrah", score: 42 }]), "zulrah")).toBe(42);
  });

  it("handles source with suffix — 'Sol Heredit (Fortis Colosseum)' matches 'Sol Heredit'", () => {
    expect(findActivityScore(mk([{ name: "Sol Heredit", score: 17 }]), "Sol Heredit (Fortis Colosseum)")).toBe(17);
  });

  it("handles source prefix — 'TzKal-Zuk' matches 'TzKal-Zuk (Inferno)'", () => {
    expect(findActivityScore(mk([{ name: "TzKal-Zuk", score: 5 }]), "TzKal-Zuk (Inferno)")).toBe(5);
  });

  it("returns null when score is 0", () => {
    expect(findActivityScore(mk([{ name: "Zulrah", score: 0 }]), "Zulrah")).toBeNull();
  });

  it("returns null when no match", () => {
    expect(findActivityScore(mk([{ name: "Zulrah", score: 10 }]), "Vorkath")).toBeNull();
  });

  it("returns null when activities missing", () => {
    expect(findActivityScore({ skills: [], activities: undefined as unknown as HiscoreData["activities"] }, "x")).toBeNull();
  });

  it("does not match on a short source that is substring-contained in many names", () => {
    expect(findActivityScore(mk([{ name: "Nexus of Elements", score: 7 }]), "Nex")).toBeNull();
  });

  it("prefers exact over fuzzy when both would match", () => {
    const d = mk([
      { name: "Chaos Fanatic", score: 1 },
      { name: "Chaos Elemental", score: 2 },
    ]);
    expect(findActivityScore(d, "Chaos Elemental")).toBe(2);
  });
});
