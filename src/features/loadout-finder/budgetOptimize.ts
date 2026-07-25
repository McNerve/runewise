/**
 * Under-budget gear optimizer.
 *
 * - greedyOptimizeUnderBudget: weapon → armour sequential fill
 * - beamOptimizeUnderBudget: beam search over weapons + slot orderings
 *   (catches cases where a slightly weaker weapon leaves budget for better armour)
 *
 * Not full GearScape-class combinatorial search, but far stronger than presets alone.
 */
import type { WikiEquipment, EquipmentSlot } from "../../lib/api/equipment";
import type { HiscoreData } from "../../lib/api/hiscores";
import type { CombatStyle, EquippedGear } from "../dps-calc/dpsTypes";
import { calculateDps } from "../../lib/formulas/dps";
import { knownWeaponSpeed } from "../../lib/data/weapon-speeds";
import { buildDpsInput, type LoadoutTarget, type RankedLoadout } from "./budgetLoadoutFinder";
import type { GearPreset } from "../../lib/data/gear-presets";

const ARMOUR_SLOTS: (EquipmentSlot | "2h")[] = [
  "head",
  "cape",
  "neck",
  "ammo",
  "body",
  "legs",
  "hands",
  "feet",
  "ring",
  "shield",
];

/** Slot fill order variants so beam search escapes greedy local optima. */
const SLOT_ORDERS: (EquipmentSlot | "2h")[][] = [
  ARMOUR_SLOTS,
  // Strength / offence first
  ["neck", "body", "legs", "head", "feet", "hands", "cape", "ring", "shield", "ammo"],
  // Cheap jewellery first (often better value under tight budgets)
  ["ring", "neck", "cape", "hands", "feet", "head", "legs", "body", "shield", "ammo"],
];

function priceOrZero(priceOf: (n: string) => number | null, name: string): number {
  const p = priceOf(name);
  return p != null && p > 0 ? p : 0;
}

function styleOk(item: WikiEquipment, style: CombatStyle): boolean {
  const n = item.name.toLowerCase();
  if (style === "melee") {
    if (n.includes("bow") || n.includes("crossbow") || n.includes("blowpipe")) return false;
    if ((n.includes("staff") || n.includes("trident") || n.includes("wand")) && !n.includes("halberd"))
      return false;
  }
  if (style === "ranged") {
    if (n.includes("scimitar") || n.includes("whip") || n.includes("rapier") || n.includes("scythe"))
      return false;
    if (n.includes("staff") || n.includes("trident") || n.includes("sang") || n.includes("shadow"))
      return false;
  }
  if (style === "magic") {
    if (n.includes("bow") || n.includes("crossbow") || n.includes("whip") || n.includes("rapier"))
      return false;
    if (n.includes("scimitar") || n.includes("scythe") || n.includes("maul")) return false;
  }
  return true;
}

function setupCost(gear: EquippedGear, priceOf: (n: string) => number | null): number {
  let t = 0;
  for (const item of Object.values(gear)) {
    if (item) t += priceOrZero(priceOf, item.name);
  }
  return t;
}

function scoreGear(
  style: CombatStyle,
  gear: EquippedGear,
  hiscores: HiscoreData | null,
  target: LoadoutTarget
): { dps: number; maxHit: number; accuracy: number; ttk: number } {
  const input = buildDpsInput(style, gear, hiscores, target);
  const r = calculateDps(input);
  return { dps: r.dps, maxHit: r.maxHit, accuracy: r.accuracy, ttk: r.ttk };
}

function offensiveScore(item: WikiEquipment, style: CombatStyle): number {
  if (style === "ranged") return item.attackRanged + item.rangedStrength;
  if (style === "magic") return item.attackMagic + item.magicDamage;
  return Math.max(item.attackSlash, item.attackStab, item.attackCrush) + item.strengthBonus;
}

function toRanked(
  style: CombatStyle,
  gear: EquippedGear,
  hiscores: HiscoreData | null,
  target: LoadoutTarget,
  priceOf: (n: string) => number | null,
  budget: number,
  unlimited: boolean,
  description: string
): RankedLoadout | null {
  if (Object.keys(gear).length === 0) return null;
  const scored = scoreGear(style, gear, hiscores, target);
  const totalCost = setupCost(gear, priceOf);
  const slotsFilled = Object.values(gear).filter(Boolean).length;
  const styleLabel = `${style[0]!.toUpperCase()}${style.slice(1)}`;
  const preset: GearPreset = {
    name: `Optimized ${styleLabel}`,
    style,
    description,
    slots: Object.fromEntries(
      Object.entries(gear)
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, v!.name])
    ),
  };
  return {
    preset,
    gear,
    resolvedSlots: slotsFilled,
    missingItems: [],
    totalCost,
    unpricedCount: Object.values(gear).filter((i) => i && priceOrZero(priceOf, i.name) === 0).length,
    dps: scored.dps,
    maxHit: scored.maxHit,
    accuracy: scored.accuracy,
    ttk: scored.ttk,
    style,
    withinBudget: unlimited || totalCost <= budget,
  };
}

export interface BudgetOptimizeOptions {
  equipment: WikiEquipment[];
  priceOf: (itemName: string) => number | null;
  hiscores: HiscoreData | null;
  target: LoadoutTarget;
  budget: number;
  style: CombatStyle;
  /** Cap candidates scanned per slot (perf). */
  perSlot?: number;
  /** Beam width: top partial loadouts kept per stage. Default 6. */
  beamWidth?: number;
  /** Top weapon seeds for beam search. Default 5. */
  weaponSeeds?: number;
}

interface BeamState {
  gear: EquippedGear;
  remaining: number;
  dps: number;
}

/**
 * Greedy: pick best weapon under budget, then best item per armour slot
 * while cash remains. Returns a synthetic RankedLoadout.
 */
export function greedyOptimizeUnderBudget(opts: BudgetOptimizeOptions): RankedLoadout | null {
  const {
    equipment,
    priceOf,
    hiscores,
    target,
    budget,
    style,
    perSlot = 40,
  } = opts;

  const unlimited = !Number.isFinite(budget) || budget <= 0;
  let remaining = unlimited ? Number.POSITIVE_INFINITY : budget;
  const gear: EquippedGear = {};

  // ── Weapon first ────────────────────────────────────────────
  const weapons = equipment
    .filter((e) => (e.slot === "weapon" || e.slot === "2h") && styleOk(e, style))
    .filter((e) => {
      if (e.slot === "weapon" || e.slot === "2h") {
        const speed = e.attackSpeed || knownWeaponSpeed(e.name) || 0;
        return speed > 0 || style === "magic"; // magic often staff speed 4 default
      }
      return true;
    });

  let bestW: { item: WikiEquipment; dps: number; cost: number } | null = null;
  const emptyScore = scoreGear(style, {}, hiscores, target).dps;

  for (const w of weapons) {
    const cost = priceOrZero(priceOf, w.name);
    if (!unlimited && cost > remaining) continue;
    // Prefer priced weapons when budget set so untradeables don't always win
    if (!unlimited && cost === 0 && w.name.toLowerCase().includes("broken")) continue;
    const trial: EquippedGear =
      w.slot === "2h" ? { "2h": w } : { weapon: w };
    const { dps } = scoreGear(style, trial, hiscores, target);
    if (!bestW || dps > bestW.dps || (dps === bestW.dps && cost < bestW.cost)) {
      bestW = { item: w, dps, cost };
    }
  }

  if (bestW && bestW.dps >= emptyScore) {
    if (bestW.item.slot === "2h") gear["2h"] = bestW.item;
    else gear.weapon = bestW.item;
    if (!unlimited) remaining -= bestW.cost;
  }

  // ── Armour / jewellery slots ────────────────────────────────
  for (const slot of ARMOUR_SLOTS) {
    if (slot === "shield" && gear["2h"]) continue;
    if (slot === "ammo" && style === "melee") continue;

    const current = gear[slot] ?? null;
    const base = scoreGear(style, gear, hiscores, target).dps;

    const candidates = equipment
      .filter((e) => e.slot === slot && styleOk(e, style))
      .map((item) => {
        const cost = priceOrZero(priceOf, item.name);
        return { item, cost };
      })
      .filter(({ cost }) => unlimited || cost <= remaining)
      .sort((a, b) => offensiveScore(b.item, style) - offensiveScore(a.item, style))
      .slice(0, perSlot);

    let best: { item: WikiEquipment; dps: number; cost: number } | null = null;
    for (const { item, cost } of candidates) {
      if (current && item.name === current.name) continue;
      const trial = { ...gear, [slot]: item } as EquippedGear;
      if (slot === "weapon") delete trial["2h"];
      const { dps } = scoreGear(style, trial, hiscores, target);
      if (dps <= base + 0.005) continue;
      if (!best || dps > best.dps || (Math.abs(dps - best.dps) < 0.01 && cost < best.cost)) {
        best = { item, dps, cost };
      }
    }
    if (best) {
      gear[slot] = best.item;
      if (!unlimited) remaining -= best.cost;
    }
  }

  return toRanked(
    style,
    gear,
    hiscores,
    target,
    priceOf,
    budget,
    unlimited,
    "Greedy under-budget fill (weapon → armour)"
  );
}

/**
 * Beam search under budget.
 *
 * Seeds several top weapons (not just #1), then for each slot-order variant
 * expands a beam of partial loadouts. Keeps the best final gear. Catches
 * "cheap weapon + better armour" tradeoffs that pure greedy misses.
 */
export function beamOptimizeUnderBudget(opts: BudgetOptimizeOptions): RankedLoadout | null {
  const {
    equipment,
    priceOf,
    hiscores,
    target,
    budget,
    style,
    perSlot = 24,
    beamWidth = 6,
    weaponSeeds = 5,
  } = opts;

  const unlimited = !Number.isFinite(budget) || budget <= 0;
  const cashCap = unlimited ? Number.POSITIVE_INFINITY : budget;

  const weapons = equipment
    .filter((e) => (e.slot === "weapon" || e.slot === "2h") && styleOk(e, style))
    .filter((e) => {
      const speed = e.attackSpeed || knownWeaponSpeed(e.name) || 0;
      return speed > 0 || style === "magic";
    })
    .map((w) => {
      const cost = priceOrZero(priceOf, w.name);
      return { w, cost };
    })
    .filter(({ w, cost }) => {
      if (!unlimited && cost > cashCap) return false;
      if (!unlimited && cost === 0 && w.name.toLowerCase().includes("broken")) return false;
      return true;
    });

  // Score weapons alone; keep top seeds by DPS (prefer cheaper when close).
  const weaponRanked = weapons
    .map(({ w, cost }) => {
      const trial: EquippedGear = w.slot === "2h" ? { "2h": w } : { weapon: w };
      const { dps } = scoreGear(style, trial, hiscores, target);
      return { w, cost, dps, trial };
    })
    .sort((a, b) => b.dps - a.dps || a.cost - b.cost)
    .slice(0, Math.max(1, weaponSeeds));

  if (weaponRanked.length === 0) {
    // Fall back to greedy (may still fill armour-only in edge cases)
    return greedyOptimizeUnderBudget(opts);
  }

  // Pre-index candidates per slot for style
  const bySlot = new Map<string, { item: WikiEquipment; cost: number }[]>();
  for (const slot of ARMOUR_SLOTS) {
    const list = equipment
      .filter((e) => e.slot === slot && styleOk(e, style))
      .map((item) => ({ item, cost: priceOrZero(priceOf, item.name) }))
      .sort((a, b) => offensiveScore(b.item, style) - offensiveScore(a.item, style))
      .slice(0, perSlot);
    bySlot.set(slot, list);
  }

  let bestGear: EquippedGear | null = null;
  let bestDps = -1;
  let bestCost = Number.POSITIVE_INFINITY;

  const consider = (gear: EquippedGear) => {
    const { dps } = scoreGear(style, gear, hiscores, target);
    const cost = setupCost(gear, priceOf);
    if (dps > bestDps + 0.001 || (Math.abs(dps - bestDps) < 0.001 && cost < bestCost)) {
      bestDps = dps;
      bestCost = cost;
      bestGear = { ...gear };
    }
  };

  for (const seed of weaponRanked) {
    for (const order of SLOT_ORDERS) {
      let beam: BeamState[] = [
        {
          gear: { ...seed.trial },
          remaining: unlimited ? Number.POSITIVE_INFINITY : cashCap - seed.cost,
          dps: seed.dps,
        },
      ];

      for (const slot of order) {
        const next: BeamState[] = [];
        for (const state of beam) {
          // Always keep "skip this slot" so we can spend later
          next.push(state);

          if (slot === "shield" && state.gear["2h"]) continue;
          if (slot === "ammo" && style === "melee") continue;

          const candidates = bySlot.get(slot) ?? [];
          for (const { item, cost } of candidates) {
            if (!unlimited && cost > state.remaining) continue;
            if (state.gear[slot]?.name === item.name) continue;
            const trial = { ...state.gear, [slot]: item } as EquippedGear;
            const { dps } = scoreGear(style, trial, hiscores, target);
            // Only expand if not worse than parent (small epsilon for noise)
            if (dps + 0.002 < state.dps) continue;
            next.push({
              gear: trial,
              remaining: unlimited ? Number.POSITIVE_INFINITY : state.remaining - cost,
              dps,
            });
          }
        }
        // Prune beam: keep highest DPS, then more remaining cash as tiebreak
        next.sort((a, b) => b.dps - a.dps || b.remaining - a.remaining);
        beam = next.slice(0, beamWidth);
      }

      for (const state of beam) {
        consider(state.gear);
      }
    }
  }

  // Also compare pure greedy (cheap insurance)
  const greedy = greedyOptimizeUnderBudget(opts);
  if (greedy) consider(greedy.gear);

  if (!bestGear) return greedy;

  return toRanked(
    style,
    bestGear,
    hiscores,
    target,
    priceOf,
    budget,
    unlimited,
    "Beam search under budget (multi-weapon + slot orders)"
  );
}

/** Prefer beam search; falls back to greedy if beam finds nothing. */
export function optimizeUnderBudget(opts: BudgetOptimizeOptions): RankedLoadout | null {
  return beamOptimizeUnderBudget(opts) ?? greedyOptimizeUnderBudget(opts);
}

/** Run optimizer for each style and return non-null results. */
export function greedyOptimizeAllStyles(
  opts: Omit<BudgetOptimizeOptions, "style"> & { styles?: CombatStyle[] }
): RankedLoadout[] {
  return optimizeAllStyles(opts);
}

/** Run beam optimizer for each style (preferred entry for UI). */
export function optimizeAllStyles(
  opts: Omit<BudgetOptimizeOptions, "style"> & { styles?: CombatStyle[] }
): RankedLoadout[] {
  const styles = opts.styles?.length ? opts.styles : (["melee", "ranged", "magic"] as CombatStyle[]);
  const out: RankedLoadout[] = [];
  for (const style of styles) {
    const r = optimizeUnderBudget({ ...opts, style });
    if (r && r.dps > 0) out.push(r);
  }
  out.sort((a, b) => b.dps - a.dps);
  return out;
}
