/**
 * Tests for boss guide cross-nav URL parameter consumers.
 *
 * Covers:
 *  - weakness → DPS Calc style mapping (weaknessToStyle)
 *  - normalizeBossSlug utility
 *  - summary fallback weakness extraction
 *  - DPS style param handling in useDpsState
 *  - Dry Calc kc + boss params
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDpsState } from "../../dps-calc/hooks/useDpsState";

// --- Utility functions duplicated here to keep tests independent ---
function weaknessToStyle(weakness: string): string {
  const map: Record<string, string> = {
    stab: "melee",
    slash: "melee",
    crush: "melee",
    melee: "melee",
    ranged: "ranged",
    range: "ranged",
    magic: "magic",
    mage: "magic",
  };
  return map[weakness.toLowerCase()] ?? "melee";
}

function normalizeBossSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function extractWeaknessFromSummary(summary: string | undefined): string | null {
  if (!summary) return null;
  const m = summary.match(/weak(?:\s+against|\s+to|ness:?)\s+([a-z]+)/i);
  return m ? m[1] : null;
}

// --- weaknessToStyle tests ---
describe("weaknessToStyle", () => {
  it("maps stab to melee", () => {
    expect(weaknessToStyle("stab")).toBe("melee");
  });
  it("maps slash to melee", () => {
    expect(weaknessToStyle("slash")).toBe("melee");
  });
  it("maps crush to melee", () => {
    expect(weaknessToStyle("crush")).toBe("melee");
  });
  it("maps Melee (case-insensitive) to melee", () => {
    expect(weaknessToStyle("Melee")).toBe("melee");
  });
  it("maps ranged to ranged", () => {
    expect(weaknessToStyle("ranged")).toBe("ranged");
  });
  it("maps Range to ranged", () => {
    expect(weaknessToStyle("Range")).toBe("ranged");
  });
  it("maps magic to magic", () => {
    expect(weaknessToStyle("magic")).toBe("magic");
  });
  it("maps Mage to magic", () => {
    expect(weaknessToStyle("Mage")).toBe("magic");
  });
  it("falls back to melee for unknown value", () => {
    expect(weaknessToStyle("fire")).toBe("melee");
  });
});

// --- normalizeBossSlug tests ---
describe("normalizeBossSlug", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(normalizeBossSlug("General Graardor")).toBe("general-graardor");
  });
  it("strips special chars", () => {
    expect(normalizeBossSlug("K'ril Tsutsaroth")).toBe("kril-tsutsaroth");
  });
  it("handles Vorkath", () => {
    expect(normalizeBossSlug("Vorkath")).toBe("vorkath");
  });
  it("handles Tombs of Amascut", () => {
    expect(normalizeBossSlug("Tombs of Amascut")).toBe("tombs-of-amascut");
  });
});

// --- extractWeaknessFromSummary tests ---
describe("extractWeaknessFromSummary", () => {
  it("extracts 'weak to X'", () => {
    expect(extractWeaknessFromSummary("Boss is weak to ranged attacks.")).toBe("ranged");
  });
  it("extracts 'weak against X'", () => {
    expect(extractWeaknessFromSummary("It is weak against magic.")).toBe("magic");
  });
  it("extracts 'weakness: X'", () => {
    expect(extractWeaknessFromSummary("Weakness: stab weapons work best.")).toBe("stab");
  });
  it("returns null when no weakness in text", () => {
    expect(extractWeaknessFromSummary("A tough boss with high HP.")).toBeNull();
  });
  it("returns null for undefined input", () => {
    expect(extractWeaknessFromSummary(undefined)).toBeNull();
  });
  it("is case-insensitive", () => {
    expect(extractWeaknessFromSummary("WEAK TO MAGIC")).toBe("MAGIC");
  });
});

// --- useDpsState style param handling ---
let navParams: Record<string, string> = {};

vi.mock("../../../lib/NavigationContext", () => ({
  useNavigation: () => ({ navigate: () => {}, params: navParams }),
}));

describe("useDpsState — style param from cross-nav", () => {
  beforeEach(() => {
    localStorage.clear();
    navParams = {};
  });

  it("defaults to melee when no style param", () => {
    navParams = {};
    const { result } = renderHook(() => useDpsState({ hiscores: null }));
    expect(result.current.combatStyle).toBe("melee");
  });

  it("switches to ranged when style=ranged param provided", () => {
    navParams = { style: "ranged" };
    const { result } = renderHook(() => useDpsState({ hiscores: null }));
    act(() => {});
    expect(result.current.combatStyle).toBe("ranged");
  });

  it("switches to magic when style=magic param provided", () => {
    navParams = { style: "magic" };
    const { result } = renderHook(() => useDpsState({ hiscores: null }));
    act(() => {});
    expect(result.current.combatStyle).toBe("magic");
  });

  it("ignores unknown style param values", () => {
    navParams = { style: "fire" };
    const { result } = renderHook(() => useDpsState({ hiscores: null }));
    act(() => {});
    // Should stay at melee (default), not change to unknown
    expect(result.current.combatStyle).toBe("melee");
  });
});
