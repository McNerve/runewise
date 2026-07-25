/**
 * Greedy under-budget gear optimizer: fill slots by best DPS gain within cash.
 * Not full combinatorial BiS, but much stronger than presets alone.
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

export interface BudgetOptimizeOptions {
  equipment: WikiEquipment[];
  priceOf: (itemName: string) => number | null;
  hiscores: HiscoreData | null;
  target: LoadoutTarget;
  budget: number;
  style: CombatStyle;
  /** Cap candidates scanned per slot (perf). */
  perSlot?: number;
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
        const speed = e.attackSpeed || knownWeaponSpeed(e.name);
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
      .sort((a, b) => {
        // Prefer higher offensive stats for a cheap pre-filter
        const sa =
          style === "ranged"
            ? a.item.attackRanged + a.item.rangedStrength
            : style === "magic"
              ? a.item.attackMagic + a.item.magicDamage
              : a.item.attackSlash + a.item.strengthBonus;
        const sb =
          style === "ranged"
            ? b.item.attackRanged + b.item.rangedStrength
            : style === "magic"
              ? b.item.attackMagic + b.item.magicDamage
              : b.item.attackSlash + b.item.strengthBonus;
        return sb - sa;
      })
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

  if (Object.keys(gear).length === 0) return null;

  const scored = scoreGear(style, gear, hiscores, target);
  const totalCost = setupCost(gear, priceOf);
  const slotsFilled = Object.values(gear).filter(Boolean).length;

  const preset: GearPreset = {
    name: `Optimized ${style[0]!.toUpperCase()}${style.slice(1)}`,
    style,
    description: "Greedy under-budget fill (weapon → armour)",
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

/** Run greedy optimize for each style and return non-null results. */
export function greedyOptimizeAllStyles(
  opts: Omit<BudgetOptimizeOptions, "style"> & { styles?: CombatStyle[] }
): RankedLoadout[] {
  const styles = opts.styles?.length ? opts.styles : (["melee", "ranged", "magic"] as CombatStyle[]);
  const out: RankedLoadout[] = [];
  for (const style of styles) {
    const r = greedyOptimizeUnderBudget({ ...opts, style });
    if (r && r.dps > 0) out.push(r);
  }
  out.sort((a, b) => b.dps - a.dps);
  return out;
}
