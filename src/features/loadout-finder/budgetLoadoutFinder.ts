/**
 * Budget loadout finder: rank full gear presets by DPS under a gp budget.
 * "Monster + budget + stats → best setup" — GearScape-class job using our DPS engine.
 */
import { calculateDps, type DpsInput, DPS_MODIFIERS } from "../../lib/formulas/dps";
import { GEAR_PRESETS, type GearPreset } from "../../lib/data/gear-presets";
import { PRAYERS } from "../../lib/data/prayers";
import { knownWeaponSpeed } from "../../lib/data/weapon-speeds";
import type { WikiEquipment, EquipmentSlot } from "../../lib/api/equipment";
import type { HiscoreData } from "../../lib/api/hiscores";
import {
  sumGearBonuses,
  meleeAttackBonus,
  GENERIC_STANCES,
  DEFAULT_SPEED,
} from "../dps-calc/dpsGearMath";
import type { EquippedGear, CombatStyle } from "../dps-calc/dpsTypes";
import { detectGearPassives } from "../dps-calc/gearPassives";
import { lookupMonsterMeta } from "../../lib/data/monster-attributes";

export interface LoadoutTarget {
  name: string;
  defLevel: number;
  defBonus: number;
  hp: number;
  magicLevel?: number;
  /** Prefer stab/slash/crush for melee defence pick. */
  preferDefStyle?: "stab" | "slash" | "crush" | "ranged" | "magic";
}

export interface BudgetFindOptions {
  equipment: WikiEquipment[];
  /** Item name (lower) → buy price (high). Missing = unknown (counts as 0 or skip). */
  priceOf: (itemName: string) => number | null;
  hiscores: HiscoreData | null;
  target: LoadoutTarget;
  /** Max total setup cost (buy side). 0 or Infinity = unlimited. */
  budget: number;
  /** Limit styles considered. Default all. */
  styles?: CombatStyle[];
  /** If true, skip presets with any unpriced item. */
  requirePriced?: boolean;
  /** Max results. */
  limit?: number;
}

export interface RankedLoadout {
  preset: GearPreset;
  gear: EquippedGear;
  resolvedSlots: number;
  missingItems: string[];
  totalCost: number;
  unpricedCount: number;
  dps: number;
  maxHit: number;
  accuracy: number;
  ttk: number;
  style: CombatStyle;
  withinBudget: boolean;
}

function skillLevel(hiscores: HiscoreData | null, name: string, fallback = 99): number {
  if (!hiscores) return fallback;
  return hiscores.skills.find((s) => s.name.toLowerCase() === name.toLowerCase())?.level ?? fallback;
}

function resolveGear(
  preset: GearPreset,
  equipment: WikiEquipment[]
): { gear: EquippedGear; missing: string[]; resolved: number } {
  const gear: EquippedGear = {};
  const missing: string[] = [];
  let resolved = 0;
  for (const [slot, itemName] of Object.entries(preset.slots)) {
    if (!itemName) continue;
    const match = equipment.find((e) => e.name.toLowerCase() === itemName.toLowerCase());
    if (match) {
      gear[slot as EquipmentSlot | "2h"] = match;
      resolved += 1;
    } else {
      missing.push(itemName);
    }
  }
  return { gear, missing, resolved };
}

function setupCost(
  gear: EquippedGear,
  priceOf: (name: string) => number | null
): { total: number; unpriced: number } {
  let total = 0;
  let unpriced = 0;
  for (const item of Object.values(gear)) {
    if (!item) continue;
    const p = priceOf(item.name);
    if (p == null || p <= 0) {
      unpriced += 1;
    } else {
      total += p;
    }
  }
  return { total, unpriced };
}

/** Build engine input for a resolved gear set (also used by leftover-upgrade scan). */
export function buildDpsInput(
  style: CombatStyle,
  gear: EquippedGear,
  hiscores: HiscoreData | null,
  target: LoadoutTarget,
  prayerName?: string
): DpsInput {
  const bonuses = sumGearBonuses(gear);
  const stances = GENERIC_STANCES[style];
  // Prefer aggressive for melee str, rapid for ranged, accurate for magic
  let stanceIdx = 0;
  if (style === "melee") {
    const i = stances.findIndex((s) => s.name.toLowerCase().includes("aggressive"));
    if (i >= 0) stanceIdx = i;
  } else if (style === "ranged") {
    const i = stances.findIndex((s) => s.name.toLowerCase().includes("rapid"));
    if (i >= 0) stanceIdx = i;
  } else {
    const i = stances.findIndex((s) => s.name.toLowerCase().includes("accurate"));
    if (i >= 0) stanceIdx = i;
  }
  const stance = stances[stanceIdx] ?? stances[0]!;
  const prayers = PRAYERS.filter((p) => p.style === style);
  let prayerIdx = 0;
  if (prayerName) {
    const pi = prayers.findIndex((p) => p.name === prayerName);
    if (pi >= 0) prayerIdx = pi;
  } else {
    // Best offensive prayer (last non-None often strongest in our list)
    prayerIdx = Math.max(0, prayers.length - 1);
  }
  const prayer = prayers[prayerIdx] ?? prayers[0]!;

  const weapon = gear.weapon ?? gear["2h"] ?? null;
  const speed =
    (weapon ? weapon.attackSpeed || knownWeaponSpeed(weapon.name) : 0) ||
    DEFAULT_SPEED[style];

  // Melee: pick stab/slash/crush from weapon combatStyle, name, or highest bonus
  const meleeType =
    style === "melee" ? bestMeleeAttackType(weapon, bonuses) : stance.attackType;

  const attackBonus =
    style === "ranged"
      ? bonuses.rangedBonus
      : style === "magic"
        ? bonuses.magicBonus
        : meleeAttackBonus(bonuses, meleeType);
  const strengthBonus =
    style === "ranged"
      ? bonuses.rangedStrength
      : style === "magic"
        ? bonuses.magicDamage
        : bonuses.strengthBonus;

  const passiveIds = detectGearPassives(gear, style);
  const modifiers = passiveIds
    .map((id) => DPS_MODIFIERS[id])
    .filter((m): m is NonNullable<typeof m> => m != null);

  const meta = lookupMonsterMeta(target.name);
  // Prefer style-matched target def when target exposes per-style (LoadoutTarget is scalar today)
  const defBonus = target.defBonus;

  return {
    attackLevel: skillLevel(hiscores, "Attack"),
    strengthLevel: skillLevel(hiscores, "Strength"),
    rangedLevel: skillLevel(hiscores, "Ranged"),
    magicLevel: skillLevel(hiscores, "Magic"),
    attackBonus,
    strengthBonus,
    prayerAttackMult: prayer.attackMult,
    prayerStrengthMult: prayer.strengthMult,
    stanceAttackBonus: stance.attackBonus,
    stanceStrengthBonus: stance.strengthBonus,
    attackSpeed: Math.max(1, speed + (stance.speedMod ?? 0)),
    combatStyle: style,
    targetDefLevel: target.defLevel,
    targetDefBonus: defBonus,
    targetHp: target.hp,
    targetMagicLevel: target.magicLevel,
    modifiers,
    prayerMagicDamagePct: prayer.magicDamagePct ?? 0,
    attackType: meleeType,
    weaponName: weapon?.name,
    monsterSize: meta.size,
    tbowRaidCap: meta.attributes.includes("xerician"),
    demonbaneVulnerability: meta.demonbaneVulnerability,
  };
}

/** Infer best melee attack type for BiS scoring (weapon-aware). */
function bestMeleeAttackType(
  weapon: WikiEquipment | null,
  bonuses: { attackStab: number; attackSlash: number; attackCrush: number }
): "stab" | "slash" | "crush" {
  const cs = weapon?.combatStyle?.toLowerCase();
  if (cs === "stab" || cs === "slash" || cs === "crush") return cs;

  const n = (weapon?.name ?? "").toLowerCase();
  if (
    n.includes("rapier") ||
    n.includes("fang") ||
    n.includes("dagger") ||
    n.includes("hasta") ||
    n.includes("spear") ||
    n.includes("bayonet")
  )
    return "stab";
  if (
    n.includes("mace") ||
    n.includes("warhammer") ||
    n.includes("maul") ||
    n.includes("bludgeon") ||
    n.includes("bulwark") ||
    n.includes("club") ||
    n.includes("flail")
  )
    return "crush";
  if (n.includes("scimitar") || n.includes("whip") || n.includes("scythe") || n.includes("sword"))
    return "slash";

  // Highest total attack bonus among the three
  if (bonuses.attackStab >= bonuses.attackSlash && bonuses.attackStab >= bonuses.attackCrush)
    return "stab";
  if (bonuses.attackCrush >= bonuses.attackSlash && bonuses.attackCrush >= bonuses.attackStab)
    return "crush";
  return "slash";
}

/**
 * Rank gear presets by DPS, filtered by budget.
 */
export function findBudgetLoadouts(opts: BudgetFindOptions): RankedLoadout[] {
  const {
    equipment,
    priceOf,
    hiscores,
    target,
    budget,
    styles,
    requirePriced = false,
    limit = 12,
  } = opts;

  const unlimited = !Number.isFinite(budget) || budget <= 0;
  const styleFilter = styles && styles.length > 0 ? new Set(styles) : null;
  const ranked: RankedLoadout[] = [];

  for (const preset of GEAR_PRESETS) {
    if (styleFilter && !styleFilter.has(preset.style)) continue;
    const { gear, missing, resolved } = resolveGear(preset, equipment);
    if (resolved === 0) continue;

    const { total, unpriced } = setupCost(gear, priceOf);
    if (requirePriced && unpriced > 0) continue;
    const withinBudget = unlimited || total <= budget;
    if (!withinBudget && !unlimited) continue;
    // Soft: if budget set and everything unpriced, skip (can't validate)
    if (!unlimited && total === 0 && unpriced > 0 && requirePriced) continue;

    const input = buildDpsInput(preset.style, gear, hiscores, target, preset.prayer);
    const result = calculateDps(input);

    ranked.push({
      preset,
      gear,
      resolvedSlots: resolved,
      missingItems: missing,
      totalCost: total,
      unpricedCount: unpriced,
      dps: result.dps,
      maxHit: result.maxHit,
      accuracy: result.accuracy,
      ttk: result.ttk,
      style: preset.style,
      withinBudget,
    });
  }

  ranked.sort((a, b) => b.dps - a.dps);
  return ranked.slice(0, limit);
}

/** Default monster targets for the finder UI. */
export const FINDER_TARGETS: LoadoutTarget[] = [
  { name: "Vorkath", defLevel: 214, defBonus: 26, hp: 750, magicLevel: 150, preferDefStyle: "stab" },
  { name: "Zulrah", defLevel: 300, defBonus: 50, hp: 500, magicLevel: 300, preferDefStyle: "magic" },
  { name: "General Graardor", defLevel: 250, defBonus: 90, hp: 255, preferDefStyle: "slash" },
  { name: "Cerberus", defLevel: 100, defBonus: 50, hp: 600, preferDefStyle: "crush" },
  { name: "Alchemical Hydra", defLevel: 100, defBonus: 0, hp: 1100, preferDefStyle: "ranged" },
  { name: "Corporeal Beast", defLevel: 310, defBonus: 200, hp: 2000, preferDefStyle: "stab" },
  { name: "K'ril Tsutsaroth", defLevel: 270, defBonus: 20, hp: 255, preferDefStyle: "slash" },
  { name: "Custom / Dummy", defLevel: 100, defBonus: 0, hp: 150 },
];
