/**
 * Budget loadout finder: rank full gear presets by DPS under a gp budget.
 * "Monster + budget + stats → best setup" — GearScape-class job using our DPS engine.
 */
import { calculateDps, type DpsInput, DPS_MODIFIERS } from "../../lib/formulas/dps";
import { GEAR_PRESETS, type GearPreset } from "../../lib/data/gear-presets";
import { PRAYERS } from "../../lib/data/prayers";
import { knownWeaponSpeed } from "../../lib/data/weapon-speeds";
import type { WikiEquipment, EquipmentSlot } from "../../lib/api/equipment";
import { type HiscoreData, getSkillLevel } from "../../lib/api/hiscores";
import {
  sumGearBonuses,
  meleeAttackBonus,
  GENERIC_STANCES,
  DEFAULT_SPEED,
} from "../dps-calc/dpsGearMath";
import type { EquippedGear, CombatStyle } from "../dps-calc/dpsTypes";
import {
  detectGearPassives,
  countCrystalPieces,
  countInquisitorBonus,
  hasSmokeStaff,
  hasChaosGauntlets,
} from "../dps-calc/gearPassives";
import { lookupMonsterMeta } from "../../lib/data/monster-attributes";
import { resolveMagicSpell } from "./magicSpellBiS";

export interface LoadoutTarget {
  name: string;
  defLevel: number;
  /**
   * Fallback single defence bonus when per-style values are omitted.
   * Prefer defStab/defSlash/… when available.
   */
  defBonus: number;
  hp: number;
  magicLevel?: number;
  /** Per-style NPC defence bonuses (wiki). Used for attack-type BiS. */
  defStab?: number;
  defSlash?: number;
  defCrush?: number;
  defRanged?: number;
  defMagic?: number;
  /** Prefer stab/slash/crush for melee defence pick (hint only). */
  preferDefStyle?: "stab" | "slash" | "crush" | "ranged" | "magic";
}

export interface BuildDpsOptions {
  prayerName?: string;
  /** On-task: apply slayer helm (i) if equipped (or always model on-task for BiS). */
  onTask?: boolean;
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
  /** Item names treated as free (already owned). */
  ownedItems?: string[];
  /** Item names excluded from consideration. */
  excludeItems?: string[];
  /** On-task slayer helm boost. */
  onTask?: boolean;
}

/** Treat owned gear as 0 gp when pricing setups. */
export function withOwnedPrices(
  priceOf: (itemName: string) => number | null,
  ownedItems?: string[] | null
): (itemName: string) => number | null {
  if (!ownedItems?.length) return priceOf;
  const owned = new Set(ownedItems.map((n) => n.toLowerCase().trim()).filter(Boolean));
  return (name: string) => {
    if (owned.has(name.toLowerCase())) return 0;
    return priceOf(name);
  };
}

/**
 * Cash to equip this item.
 * - `> 0` — GE buy price
 * - `0` — owned / explicitly free
 * - `null` — no price (not buyable on a capped budget)
 */
export function itemCashCost(
  priceOf: (name: string) => number | null,
  name: string
): number | null {
  const p = priceOf(name);
  if (p == null) return null;
  return p > 0 ? p : 0;
}

/**
 * Optimizer cost. Unpriced items are free only when the budget is unlimited
 * (`Any`). A capped budget cannot pretend missing GE data is 0 gp.
 */
export function candidateCost(
  priceOf: (name: string) => number | null,
  name: string,
  unlimited: boolean
): number | null {
  const cash = itemCashCost(priceOf, name);
  if (cash == null) return unlimited ? 0 : null;
  return cash;
}

/** Drop excluded item names from an equipment catalog. */
export function filterExcludedEquipment(
  equipment: WikiEquipment[],
  excludeItems?: string[] | null
): WikiEquipment[] {
  if (!excludeItems?.length) return equipment;
  const ban = new Set(excludeItems.map((n) => n.toLowerCase().trim()).filter(Boolean));
  return equipment.filter((e) => !ban.has(e.name.toLowerCase()));
}

/** Resolve NPC defence bonus for a combat style / melee attack type. */
export function resolveTargetDefBonus(
  target: LoadoutTarget,
  style: CombatStyle,
  meleeType?: string
): number {
  if (style === "ranged") {
    return target.defRanged ?? target.defBonus;
  }
  if (style === "magic") {
    return target.defMagic ?? target.defBonus;
  }
  const t = (meleeType ?? target.preferDefStyle ?? "slash").toLowerCase();
  if (t === "stab") return target.defStab ?? target.defBonus;
  if (t === "crush") return target.defCrush ?? target.defBonus;
  return target.defSlash ?? target.defBonus;
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
  /** Offensive prayer used for scoring. */
  prayerName?: string;
  /** Magic spell / powered staff attack used for scoring. */
  spellName?: string;
}

/**
 * Best offensive prayer the player can use for this style given Prayer level.
 * Preferred name wins if unlocked; otherwise max attack×strength (magic: +dmg%).
 */
export function bestPrayerForStyle(
  style: CombatStyle,
  prayerLevel: number,
  preferredName?: string
): { name: string; attackMult: number; strengthMult: number; magicDamagePct: number } {
  const stylePrayers = PRAYERS.filter((p) => p.style === style);
  const unlocked = stylePrayers.filter(
    (p) => p.level == null || p.level <= prayerLevel
  );
  // If prayer level is too low for any listed prayer, fall back to neutral mults
  const pool =
    unlocked.length > 0
      ? unlocked
      : [{ name: "None", attackMult: 1, strengthMult: 1, style, magicDamagePct: 0 }];

  if (preferredName) {
    const pref = pool.find((p) => p.name === preferredName);
    if (pref) {
      return {
        name: pref.name,
        attackMult: pref.attackMult,
        strengthMult: pref.strengthMult,
        magicDamagePct: pref.magicDamagePct ?? 0,
      };
    }
  }
  // Score: product of mults + small magic dmg weight
  let best = pool[0]!;
  let bestScore = -1;
  for (const p of pool) {
    const score =
      p.attackMult * p.strengthMult + (p.magicDamagePct ?? 0) * 0.01;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return {
    name: best.name,
    attackMult: best.attackMult,
    strengthMult: best.strengthMult,
    magicDamagePct: best.magicDamagePct ?? 0,
  };
}

function skillLevel(hiscores: HiscoreData | null, name: string, fallback = 99): number {
  return getSkillLevel(hiscores, name, fallback);
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

export function setupCost(
  gear: EquippedGear,
  priceOf: (name: string) => number | null
): { total: number; unpriced: number } {
  let total = 0;
  let unpriced = 0;
  for (const item of Object.values(gear)) {
    if (!item) continue;
    const cash = itemCashCost(priceOf, item.name);
    if (cash == null) {
      unpriced += 1;
    } else {
      total += cash;
    }
  }
  return { total, unpriced };
}

/** Normalize prayerName string or options bag. */
function normalizeBuildOpts(
  opts?: string | BuildDpsOptions
): BuildDpsOptions {
  if (opts == null) return {};
  if (typeof opts === "string") return { prayerName: opts };
  return opts;
}

/** Build engine input for a resolved gear set (also used by leftover-upgrade scan). */
export function buildDpsInput(
  style: CombatStyle,
  gear: EquippedGear,
  hiscores: HiscoreData | null,
  target: LoadoutTarget,
  opts?: string | BuildDpsOptions
): DpsInput {
  const { prayerName, onTask } = normalizeBuildOpts(opts);
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
  const prayerLevel = skillLevel(hiscores, "Prayer", 99);
  const prayer = bestPrayerForStyle(style, prayerLevel, prayerName);

  const weapon = gear.weapon ?? gear["2h"] ?? null;
  const speed =
    (weapon ? weapon.attackSpeed || knownWeaponSpeed(weapon.name) : 0) ||
    DEFAULT_SPEED[style];

  // Melee: weapon-aware + target defence (pick best attack type vs multi-def NPC)
  const meleeType =
    style === "melee" ? bestMeleeAttackType(weapon, bonuses, target) : stance.attackType;

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

  const meta = lookupMonsterMeta(target.name);
  const passiveIds = filterPassivesForTarget(
    detectGearPassives(gear, style),
    meta.attributes,
    onTask === true
  );
  // On-task without helm still models slayer helm if user checked on-task and
  // wears a slayer helm — detectGearPassives does not auto-add slayer_helm.
  if (onTask) {
    const head = (gear.head?.name ?? "").toLowerCase();
    if (
      (head.includes("slayer") && head.includes("helm")) ||
      head.includes("black mask")
    ) {
      if (!passiveIds.includes("slayer_helm") && !passiveIds.some((id) => id.startsWith("salve"))) {
        passiveIds.push("slayer_helm");
      }
    }
  }

  const modifiers = passiveIds
    .map((id) => DPS_MODIFIERS[id])
    .filter((m): m is NonNullable<typeof m> => m != null);

  const defBonus = resolveTargetDefBonus(target, style, meleeType);

  const magicLevel = skillLevel(hiscores, "Magic");
  const crystalPieces = countCrystalPieces(gear);
  const inquisitorBonus = countInquisitorBonus(gear);

  // Magic: pick powered-staff attack or best unlocked autocast
  const magicSpell =
    style === "magic"
      ? resolveMagicSpell({
          magicLevel,
          weaponName: weapon?.name,
          preferFire: passiveIds.includes("tome_of_fire"),
        })
      : null;

  return {
    attackLevel: skillLevel(hiscores, "Attack"),
    strengthLevel: skillLevel(hiscores, "Strength"),
    rangedLevel: skillLevel(hiscores, "Ranged"),
    magicLevel,
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
    prayerMagicDamagePct: prayer.magicDamagePct,
    attackType: meleeType,
    weaponName: weapon?.name,
    monsterSize: meta.size,
    tbowRaidCap: meta.attributes.includes("xerician"),
    demonbaneVulnerability: meta.demonbaneVulnerability,
    spellBaseMaxHit: magicSpell?.spellBaseMaxHit,
    spellElement: magicSpell?.spellElement,
    isBoltSpell: magicSpell?.isBoltSpell,
    isGodSpell: magicSpell?.isGodSpell,
    isDemonbaneSpell: magicSpell?.isDemonbaneSpell,
    crystalPieces: crystalPieces > 0 ? crystalPieces : undefined,
    inquisitorBonus: inquisitorBonus > 0 ? inquisitorBonus : undefined,
    smokeStaff: hasSmokeStaff(gear) || undefined,
    chaosGauntlets: hasChaosGauntlets(gear) || undefined,
  };
}

/** Resolved spell name for a magic gear set (for UI labels). */
export function resolveSpellLabel(
  style: CombatStyle,
  gear: EquippedGear,
  hiscores: HiscoreData | null
): string | undefined {
  if (style !== "magic") return undefined;
  const weapon = gear.weapon ?? gear["2h"] ?? null;
  const r = resolveMagicSpell({
    magicLevel: skillLevel(hiscores, "Magic"),
    weaponName: weapon?.name,
    preferFire: (gear.shield?.name ?? "").toLowerCase().includes("tome of fire"),
  });
  return r?.spellName;
}

/**
 * Drop situational passives that do not apply to this NPC (GearScape honesty).
 * Salve only vs undead; DHL/DHCB only vs dragon; arclight only vs demon; etc.
 */
export function filterPassivesForTarget(
  passiveIds: string[],
  attributes: string[],
  onTask: boolean
): string[] {
  const attrs = new Set(attributes.map((a) => a.toLowerCase()));
  const isUndead = attrs.has("undead");
  const isDemon = attrs.has("demon");
  const isDragon = attrs.has("dragon");
  const isLeafy = attrs.has("leafy");
  const isKalphite = attrs.has("kalphite");

  return passiveIds.filter((id) => {
    if (id === "salve_e" || id === "salve_ei") return isUndead;
    if (id === "slayer_helm") return onTask;
    if (id === "arclight") return isDemon;
    if (id === "dhl" || id === "dhcb") return isDragon;
    if (id === "leaf_bladed") return isLeafy;
    if (id === "keris_partisan") return isKalphite;
    return true;
  });
}

/**
 * Infer best melee attack type for BiS scoring.
 * Prefer weapon natural style; otherwise maximize attackBonus − targetDef.
 */
export function bestMeleeAttackType(
  weapon: WikiEquipment | null,
  bonuses: { attackStab: number; attackSlash: number; attackCrush: number },
  target?: LoadoutTarget | null
): "stab" | "slash" | "crush" {
  const types = ["stab", "slash", "crush"] as const;
  const natural = naturalMeleeType(weapon);

  // If weapon is locked to one style and has meaningful attack there, use it
  if (natural) {
    const atk = meleeAttackBonus(bonuses, natural);
    if (atk > 0 || !weapon) return natural;
  }

  // Score each type: attack roll proxy minus NPC def
  let best: "stab" | "slash" | "crush" = natural ?? "slash";
  let bestScore = -Infinity;
  for (const t of types) {
    const atk = meleeAttackBonus(bonuses, t);
    if (atk <= 0 && Math.max(bonuses.attackStab, bonuses.attackSlash, bonuses.attackCrush) > 0) {
      continue; // skip unusable types when others work
    }
    const def = target
      ? resolveTargetDefBonus(target, "melee", t)
      : 0;
    // Weight attack more than def (accuracy is attack/def interaction)
    const score = atk * 1.5 - def;
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return best;
}

function naturalMeleeType(
  weapon: WikiEquipment | null
): "stab" | "slash" | "crush" | null {
  const cs = weapon?.combatStyle?.toLowerCase();
  if (cs === "stab" || cs === "slash" || cs === "crush") return cs;

  const n = (weapon?.name ?? "").toLowerCase();
  if (
    n.includes("rapier") ||
    n.includes("fang") ||
    n.includes("dagger") ||
    n.includes("hasta") ||
    n.includes("spear") ||
    n.includes("bayonet") ||
    n.includes("lance")
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
  if (
    n.includes("scimitar") ||
    n.includes("whip") ||
    n.includes("scythe") ||
    n.includes("sword") ||
    n.includes("scim")
  )
    return "slash";
  return null;
}

/**
 * Rank gear presets by DPS, filtered by budget.
 */
export function findBudgetLoadouts(opts: BudgetFindOptions): RankedLoadout[] {
  const {
    equipment: rawEquipment,
    priceOf: rawPriceOf,
    hiscores,
    target,
    budget,
    styles,
    requirePriced = false,
    limit = 12,
    ownedItems,
    excludeItems,
    onTask,
  } = opts;

  const equipment = filterExcludedEquipment(rawEquipment, excludeItems);
  const priceOf = withOwnedPrices(rawPriceOf, ownedItems);

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

    const prayerLevel = skillLevel(hiscores, "Prayer", 99);
    const prayer = bestPrayerForStyle(preset.style, prayerLevel, preset.prayer);
    const input = buildDpsInput(preset.style, gear, hiscores, target, {
      prayerName: prayer.name,
      onTask,
    });
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
      prayerName: prayer.name,
      spellName: resolveSpellLabel(preset.style, gear, hiscores),
    });
  }

  ranked.sort((a, b) => b.dps - a.dps);
  return ranked.slice(0, limit);
}

/** Default monster targets for the finder UI (per-style def from wiki data). */
export const FINDER_TARGETS: LoadoutTarget[] = [
  {
    name: "Vorkath",
    defLevel: 214,
    defBonus: 26,
    defStab: 26,
    defSlash: 108,
    defCrush: 108,
    defRanged: 26,
    defMagic: 240,
    hp: 750,
    magicLevel: 150,
    preferDefStyle: "stab",
  },
  {
    name: "Zulrah",
    defLevel: 300,
    defBonus: 50,
    defStab: 50,
    defSlash: 50,
    defCrush: 50,
    defRanged: 50,
    defMagic: 300,
    hp: 500,
    magicLevel: 300,
    preferDefStyle: "magic",
  },
  {
    name: "General Graardor",
    defLevel: 250,
    defBonus: 90,
    defStab: 90,
    defSlash: 90,
    defCrush: 90,
    defRanged: 90,
    defMagic: 0,
    hp: 255,
    preferDefStyle: "slash",
  },
  {
    name: "Cerberus",
    defLevel: 100,
    defBonus: 50,
    defStab: 100,
    defSlash: 100,
    defCrush: 50,
    defRanged: 100,
    defMagic: 100,
    hp: 600,
    preferDefStyle: "crush",
  },
  {
    name: "Alchemical Hydra",
    defLevel: 100,
    defBonus: 0,
    defStab: 0,
    defSlash: 0,
    defCrush: 0,
    defRanged: 0,
    defMagic: 0,
    hp: 1100,
    preferDefStyle: "ranged",
  },
  {
    name: "Corporeal Beast",
    defLevel: 310,
    defBonus: 200,
    defStab: 200,
    defSlash: 200,
    defCrush: 200,
    defRanged: 200,
    defMagic: 200,
    hp: 2000,
    preferDefStyle: "stab",
  },
  {
    name: "K'ril Tsutsaroth",
    defLevel: 270,
    defBonus: 20,
    defStab: 20,
    defSlash: 20,
    defCrush: 20,
    defRanged: 20,
    defMagic: 0,
    hp: 255,
    preferDefStyle: "slash",
  },
  {
    name: "Kree'arra",
    defLevel: 260,
    defBonus: 200,
    defStab: 200,
    defSlash: 200,
    defCrush: 200,
    defRanged: 0,
    defMagic: 200,
    hp: 255,
    preferDefStyle: "ranged",
  },
  {
    name: "Duke Sucellus",
    defLevel: 310,
    defBonus: 100,
    defStab: 160,
    defSlash: 200,
    defCrush: 120,
    defRanged: 200,
    defMagic: 40,
    hp: 440,
    preferDefStyle: "crush",
  },
  {
    name: "Phantom Muspah",
    defLevel: 200,
    defBonus: 50,
    defStab: 50,
    defSlash: 50,
    defCrush: 50,
    defRanged: 50,
    defMagic: 50,
    hp: 850,
    magicLevel: 150,
  },
  { name: "Custom / Dummy", defLevel: 100, defBonus: 0, hp: 150 },
];

/** Common untradeables players already own (default free chips). */
export const COMMON_OWNED_CHIPS = [
  "Fire cape",
  "Infernal cape",
  "Fighter torso",
  "Barrows gloves",
  "Dragon defender",
  "Avernic defender",
  "Ava's assembler",
  "Ava's accumulator",
  "Slayer helmet (i)",
  "Helm of neitiznot",
  "Neitiznot faceguard",
  "Void knight top",
  "Void knight robe",
  "Void knight gloves",
  "Void melee helm",
  "Elite void top",
  "Elite void robe",
] as const;
