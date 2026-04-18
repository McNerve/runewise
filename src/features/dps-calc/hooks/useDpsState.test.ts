import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { HiscoreData } from "../../../lib/api/hiscores";
import { useDpsState } from "./useDpsState";

// NavigationContext hook pulls from a React context; in hook-only tests we
// don't have a provider mounted, so stub the navigate hook out.
vi.mock("../../../lib/NavigationContext", () => ({
  useNavigation: () => ({ navigate: () => {}, params: {} }),
}));

function buildHiscores(): HiscoreData {
  const skills = [
    { name: "Overall", id: 0, rank: 1, level: 2277, xp: 500_000_000 },
    { name: "Attack", id: 1, rank: 1, level: 70, xp: 737_627 },
    { name: "Defence", id: 2, rank: 1, level: 70, xp: 737_627 },
    { name: "Strength", id: 3, rank: 1, level: 85, xp: 3_258_594 },
    { name: "Hitpoints", id: 4, rank: 1, level: 80, xp: 1_986_068 },
    { name: "Ranged", id: 5, rank: 1, level: 90, xp: 5_346_332 },
    { name: "Prayer", id: 6, rank: 1, level: 77, xp: 1_475_581 },
    { name: "Magic", id: 7, rank: 1, level: 94, xp: 7_944_614 },
  ];
  return { skills, activities: [] };
}

describe("useDpsState — combat stats from hiscores", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads all combat levels when hiscores provided", () => {
    const { result } = renderHook(() => useDpsState({ hiscores: buildHiscores() }));
    expect(result.current.attackLevel).toBe(70);
    expect(result.current.strengthLevel).toBe(85);
    expect(result.current.rangedLevel).toBe(90);
    expect(result.current.magicLevel).toBe(94);
  });

  it("keeps all levels populated across combat-style tab switches", () => {
    const { result } = renderHook(() => useDpsState({ hiscores: buildHiscores() }));

    act(() => { result.current.setCombatStyle("ranged"); });
    expect(result.current.rangedLevel).toBe(90);
    expect(result.current.magicLevel).toBe(94);

    act(() => { result.current.setCombatStyle("magic"); });
    expect(result.current.magicLevel).toBe(94);
    expect(result.current.rangedLevel).toBe(90);

    act(() => { result.current.setCombatStyle("melee"); });
    expect(result.current.attackLevel).toBe(70);
    expect(result.current.strengthLevel).toBe(85);
  });

  it("defaults to 99 on every stat when hiscores is null", () => {
    const { result } = renderHook(() => useDpsState({ hiscores: null }));
    expect(result.current.attackLevel).toBe(99);
    expect(result.current.strengthLevel).toBe(99);
    expect(result.current.rangedLevel).toBe(99);
    expect(result.current.magicLevel).toBe(99);
  });
});
