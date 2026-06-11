import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { HiscoreData } from "../../../lib/api/hiscores";
import type { WikiEquipment } from "../../../lib/api/equipment";
import type { WikiMonster } from "../../../lib/api/monsters";
import { useDpsState, sumGearBonuses, meleeAttackBonus, getDefBonus } from "./useDpsState";

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

function gearItem(over: Partial<WikiEquipment>): WikiEquipment {
  return {
    name: "x", version: null, slot: "body",
    attackStab: 0, attackSlash: 0, attackCrush: 0, attackMagic: 0, attackRanged: 0,
    defenceStab: 0, defenceSlash: 0, defenceCrush: 0, defenceMagic: 0, defenceRanged: 0,
    strengthBonus: 0, rangedStrength: 0, magicDamage: 0, prayerBonus: 0,
    combatStyle: null, attackSpeed: 0,
    ...over,
  };
}

describe("sumGearBonuses (regression: previously triple-counted melee attack)", () => {
  it("keeps stab/slash/crush attack bonuses separate", () => {
    // Bandos chestplate-like piece: distinct stab/slash/crush values
    const gear = { body: gearItem({ attackStab: 28, attackSlash: 26, attackCrush: 23, strengthBonus: 5 }) };
    const b = sumGearBonuses(gear);
    expect(b.attackStab).toBe(28);
    expect(b.attackSlash).toBe(26);
    expect(b.attackCrush).toBe(23);
    expect(b.strengthBonus).toBe(5);
  });

  it("sums each attack type across pieces independently", () => {
    const gear = {
      body: gearItem({ attackStab: 10, attackSlash: 20, attackCrush: 30 }),
      legs: gearItem({ attackStab: 1, attackSlash: 2, attackCrush: 3 }),
    };
    const b = sumGearBonuses(gear);
    expect(b.attackStab).toBe(11);
    expect(b.attackSlash).toBe(22);
    expect(b.attackCrush).toBe(33);
  });
});

describe("meleeAttackBonus selects by attack type", () => {
  const bonuses = { attackStab: 28, attackSlash: 26, attackCrush: 23 };
  it("picks the matching type, never the sum", () => {
    expect(meleeAttackBonus(bonuses, "stab")).toBe(28);
    expect(meleeAttackBonus(bonuses, "slash")).toBe(26);
    expect(meleeAttackBonus(bonuses, "crush")).toBe(23);
  });
  it("defaults to slash for unknown types", () => {
    expect(meleeAttackBonus(bonuses, "")).toBe(26);
  });
});

describe("applyLoadout across combat styles (regression: gear was dropped)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("restores gear, bonus mode, and modifiers when the style differs", () => {
    const { result } = renderHook(() => useDpsState({ hiscores: null }));
    const bow = gearItem({ name: "Twisted bow", slot: "2h" as const, attackRanged: 70 });

    act(() => {
      result.current.applyLoadout({
        name: "Tbow setup",
        combatStyle: "ranged",
        stanceIdx: 1,
        prayerIdx: 0,
        attackBonus: 0,
        strengthBonus: 0,
        attackSpeed: 5,
        modifiers: ["twisted_bow"],
        bonusMode: "equipment",
        gear: { "2h": bow },
      });
    });

    expect(result.current.combatStyle).toBe("ranged");
    expect(result.current.bonusMode).toBe("equipment");
    expect(result.current.equippedGear["2h"]?.name).toBe("Twisted bow");
    expect(result.current.activeModifiers.has("twisted_bow")).toBe(true);
    expect(result.current.stanceIdx).toBe(1);
  });
});

describe("setup tabs", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips a configuration through a tab switch", () => {
    const { result } = renderHook(() => useDpsState({ hiscores: null }));
    const helm = gearItem({ name: "Torva full helm", slot: "head" as const, attackSlash: 8 });

    act(() => {
      result.current.setCombatStyle("ranged");
    });
    act(() => {
      result.current.setEquippedGear({ head: helm });
      result.current.toggleModifier("void_ranged");
    });

    // Switch to tab B — starts as a copy; change it to a magic setup.
    act(() => {
      result.current.switchSetup(1);
    });
    act(() => {
      result.current.setCombatStyle("magic");
    });
    act(() => {
      result.current.setEquippedGear({});
    });

    // Back to tab A — the ranged setup must be fully restored.
    act(() => {
      result.current.switchSetup(0);
    });
    expect(result.current.activeSetup).toBe(0);
    expect(result.current.combatStyle).toBe("ranged");
    expect(result.current.equippedGear.head?.name).toBe("Torva full helm");
    expect(result.current.activeModifiers.has("void_ranged")).toBe(true);

    // And tab B still holds the magic setup.
    act(() => {
      result.current.switchSetup(1);
    });
    expect(result.current.combatStyle).toBe("magic");
    expect(result.current.equippedGear.head).toBeUndefined();
  });

  it("ignores out-of-range and same-tab switches", () => {
    const { result } = renderHook(() => useDpsState({ hiscores: null }));
    act(() => {
      result.current.switchSetup(0);
      result.current.switchSetup(7);
      result.current.switchSetup(-1);
    });
    expect(result.current.activeSetup).toBe(0);
  });
});

describe("getDefBonus (regression: previously used Math.min of all melee defs)", () => {
  const monster = {
    defStab: 200, defSlash: 260, defCrush: 200, defMagic: 100, defRanged: 150,
  } as WikiMonster;

  it("uses the style-specific melee defence, not the minimum", () => {
    expect(getDefBonus(monster, "melee", "slash")).toBe(260);
    expect(getDefBonus(monster, "melee", "stab")).toBe(200);
    expect(getDefBonus(monster, "melee", "crush")).toBe(200);
  });

  it("returns ranged/magic defence for those styles", () => {
    expect(getDefBonus(monster, "ranged")).toBe(150);
    expect(getDefBonus(monster, "magic")).toBe(100);
  });
});
