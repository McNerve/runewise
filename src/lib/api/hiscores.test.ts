import { describe, it, expect } from "vitest";
import { findActivityScore, type HiscoreData } from "./hiscores";

const mk = (activities: { name: string; score: number }[]): HiscoreData => ({
  skills: [],
  activities: activities.map((a, i) => ({ id: i, rank: 1, ...a })),
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
