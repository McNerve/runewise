import { calculateDps, type DpsInput, type DpsModifier } from "../../lib/formulas/dps";
import { DPS_MODIFIERS } from "../../lib/formulas/dps";
import {
  dedupeEquipment,
  type EquipmentSlot,
  type WikiEquipment,
} from "../../lib/api/equipment";
import { knownWeaponSpeed } from "../../lib/data/weapon-speeds";
import {
  meleeAttackBonus,
  type CombatStyle,
  type EquippedGear,
} from "./hooks/useDpsState";

const SCANNABLE_SLOTS: (EquipmentSlot | "2h")[] = [
  "head",
  "cape",
  "neck",
  "ammo",
  "shield",
  "body",
  "legs",
  "hands",
  "feet",
  "ring",
];

export interface UpgradeCandidate {
  item: WikiEquipment;
  dps: number;
  dpsGain: number;
  dpsGainPct: number;
}

export type UpgradeSort = "dps" | "value";

/**
 * Orders upgrades for display: by raw DPS gain, or by gp-per-DPS (cheapest
 * real improvement first). Unpriced items (untradeables) keep their DPS order
 * after every priced candidate in value mode.
 */
export function rankUpgradesForDisplay(
  upgrades: UpgradeCandidate[],
  priceOf: (itemName: string) => number | undefined,
  sort: UpgradeSort,
  limit = 3
): UpgradeCandidate[] {
  if (sort === "dps") return upgrades.slice(0, limit);
  const priced = upgrades.filter((u) => priceOf(u.item.name) !== undefined);
  const unpriced = upgrades.filter((u) => priceOf(u.item.name) === undefined);
  priced.sort(
    (a, b) => priceOf(a.item.name)! / a.dpsGain - priceOf(b.item.name)! / b.dpsGain
  );
  return [...priced, ...unpriced].slice(0, limit);
}

export interface SlotUpgrades {
  slot: EquipmentSlot | "2h";
  current: WikiEquipment | null;
  upgrades: UpgradeCandidate[];
}

export interface FindUpgradesOptions {
  baseInput: DpsInput;
  gear: EquippedGear;
  equipment: WikiEquipment[];
  combatStyle: CombatStyle;
  /** Active stance attack type — picks which melee attack bonus applies. */
  meleeAttackType: string;
  /** Current stance's speed modifier (e.g. rapid = -1), applied to weapon candidates. */
  stanceSpeedMod?: number;
  perSlot?: number;
  minGain?: number;
}

// Modifiers tied to the wielded weapon — stripped while scanning weapon
// candidates so a Twisted bow toggle can't inflate every other bow.
const WEAPON_BOUND_MODIFIERS = new Set([
  "twisted_bow",
  "tumekens_shadow",
  "dhl",
  "dhcb",
  "arclight",
  "keris_partisan",
  "leaf_bladed",
  "dinhs_bulwark",
]);

// Weapon-name → modifier id. Unconditional passives (Twisted bow, Tumeken's
// shadow) always re-attach to their weapon; situational ones (dragonbane,
// demonbane, ...) re-attach only when the user already signalled the target
// trait by having that family active.
const MODIFIER_BY_WEAPON: Record<string, string> = {
  "twisted bow": "twisted_bow",
  "tumeken's shadow": "tumekens_shadow",
  "dragon hunter lance": "dhl",
  "dragon hunter crossbow": "dhcb",
  "arclight": "arclight",
  "keris partisan": "keris_partisan",
  "leaf-bladed battleaxe": "leaf_bladed",
};
const UNCONDITIONAL_WEAPON_MODIFIERS = new Set(["twisted_bow", "tumekens_shadow"]);
const MODIFIER_TRAIT_GROUPS: string[][] = [["dhl", "dhcb"]];

function weaponCandidateModifiers(
  baseModifiers: DpsModifier[] | undefined,
  candidateName: string
): DpsModifier[] {
  const activeWeaponBound = new Set(
    (baseModifiers ?? []).map((m) => m.id).filter((id) => WEAPON_BOUND_MODIFIERS.has(id))
  );
  const kept = (baseModifiers ?? []).filter((m) => !WEAPON_BOUND_MODIFIERS.has(m.id));

  const candidateMod = MODIFIER_BY_WEAPON[candidateName.toLowerCase()];
  if (!candidateMod) return kept;

  const traitSignalled = MODIFIER_TRAIT_GROUPS.some(
    (group) => group.includes(candidateMod) && group.some((id) => activeWeaponBound.has(id))
  ) || activeWeaponBound.has(candidateMod);

  if (UNCONDITIONAL_WEAPON_MODIFIERS.has(candidateMod) || traitSignalled) {
    const mod = DPS_MODIFIERS[candidateMod];
    if (mod) return [...kept, mod];
  }
  return kept;
}

function itemStyleBonuses(
  item: WikiEquipment | null,
  combatStyle: CombatStyle,
  meleeAttackType: string,
  // For a CANDIDATE weapon, score its own best attack type (you'd use its best
  // stance) rather than whatever stance the currently-held weapon uses —
  // otherwise a stab weapon is judged on its near-zero slash bonus, etc.
  useBestMelee = false
): { attackBonus: number; strengthBonus: number } {
  if (!item) return { attackBonus: 0, strengthBonus: 0 };
  if (combatStyle === "ranged") {
    return { attackBonus: item.attackRanged, strengthBonus: item.rangedStrength };
  }
  if (combatStyle === "magic") {
    return { attackBonus: item.attackMagic, strengthBonus: item.magicDamage };
  }
  return {
    attackBonus: useBestMelee
      ? Math.max(item.attackStab, item.attackSlash, item.attackCrush)
      : meleeAttackBonus(item, meleeAttackType),
    strengthBonus: item.strengthBonus,
  };
}

/**
 * Ranks every catalog item per armour/jewellery slot by the real DPS delta it
 * would produce against the current target, holding weapon, stance, prayer,
 * and modifiers fixed.
 */
export function findUpgrades({
  baseInput,
  gear,
  equipment,
  combatStyle,
  meleeAttackType,
  stanceSpeedMod = 0,
  perSlot = 3,
  minGain = 0.01,
}: FindUpgradesOptions): SlotUpgrades[] {
  const deduped = dedupeEquipment(equipment);
  const baseDps = calculateDps(baseInput).dps;
  const hasTwoHander = Boolean(gear["2h"]);

  const results: SlotUpgrades[] = [];

  // Weapon scan: only candidates with a verified attack speed are ranked —
  // unknown speeds would make cross-weapon deltas dishonest. A 2h candidate
  // also gives up the equipped shield's bonuses; a 1h candidate replacing a
  // 2h is ranked without re-adding a shield.
  {
    const currentWeapon = gear["weapon"] ?? gear["2h"] ?? null;
    const currentShield = gear["shield"] ?? null;
    const currentWeaponBonuses = itemStyleBonuses(currentWeapon, combatStyle, meleeAttackType);
    const shieldBonuses = itemStyleBonuses(currentShield, combatStyle, meleeAttackType);
    const candidates: UpgradeCandidate[] = [];

    for (const item of deduped) {
      if (item.slot !== "weapon" && item.slot !== "2h") continue;
      if (currentWeapon && item.name === currentWeapon.name && item.version === currentWeapon.version) continue;
      const speed = item.attackSpeed || knownWeaponSpeed(item.name);
      if (!speed) continue;

      const dropsShield = item.slot === "2h" && currentShield !== null;
      const candidateBonuses = itemStyleBonuses(item, combatStyle, meleeAttackType, true);
      const attackBonus =
        baseInput.attackBonus +
        candidateBonuses.attackBonus -
        currentWeaponBonuses.attackBonus -
        (dropsShield ? shieldBonuses.attackBonus : 0);
      const strengthBonus =
        baseInput.strengthBonus +
        candidateBonuses.strengthBonus -
        currentWeaponBonuses.strengthBonus -
        (dropsShield ? shieldBonuses.strengthBonus : 0);

      const dps = calculateDps({
        ...baseInput,
        attackBonus,
        strengthBonus,
        attackSpeed: Math.max(1, speed + stanceSpeedMod),
        modifiers: weaponCandidateModifiers(baseInput.modifiers, item.name),
      }).dps;
      const dpsGain = dps - baseDps;
      if (dpsGain < minGain) continue;

      candidates.push({
        item,
        dps,
        dpsGain,
        dpsGainPct: baseDps > 0 ? (dpsGain / baseDps) * 100 : 0,
      });
    }

    candidates.sort((a, b) => b.dpsGain - a.dpsGain);
    results.push({ slot: "weapon", current: currentWeapon, upgrades: candidates.slice(0, perSlot) });
  }
  for (const slot of SCANNABLE_SLOTS) {
    // A 2h weapon occupies the shield slot.
    if (slot === "shield" && hasTwoHander) continue;

    const current = gear[slot] ?? null;
    const currentBonuses = itemStyleBonuses(current, combatStyle, meleeAttackType);
    const candidates: UpgradeCandidate[] = [];

    for (const item of deduped) {
      if (item.slot !== slot) continue;
      if (current && item.name === current.name && item.version === current.version) continue;

      // Swap delta applied on top of the live input, so the scan stays honest
      // even when the displayed bonuses include manual adjustments.
      const candidateBonuses = itemStyleBonuses(item, combatStyle, meleeAttackType);
      const attackBonus =
        baseInput.attackBonus + candidateBonuses.attackBonus - currentBonuses.attackBonus;
      const strengthBonus =
        baseInput.strengthBonus + candidateBonuses.strengthBonus - currentBonuses.strengthBonus;
      const dps = calculateDps({ ...baseInput, attackBonus, strengthBonus }).dps;
      const dpsGain = dps - baseDps;
      if (dpsGain < minGain) continue;

      candidates.push({
        item,
        dps,
        dpsGain,
        dpsGainPct: baseDps > 0 ? (dpsGain / baseDps) * 100 : 0,
      });
    }

    candidates.sort((a, b) => b.dpsGain - a.dpsGain);
    results.push({ slot, current, upgrades: candidates.slice(0, perSlot) });
  }

  return results;
}
