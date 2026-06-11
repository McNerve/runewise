import { calculateDps, type DpsInput } from "../../lib/formulas/dps";
import {
  dedupeEquipment,
  type EquipmentSlot,
  type WikiEquipment,
} from "../../lib/api/equipment";
import {
  meleeAttackBonus,
  type CombatStyle,
  type EquippedGear,
} from "./hooks/useDpsState";

// The weapon and 2h slots are deliberately not scanned: the wiki bonuses
// bucket carries no attack-speed data, so cross-weapon DPS deltas would be
// computed at the wrong speed and rank dishonestly.
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
  perSlot?: number;
  minGain?: number;
}

function itemStyleBonuses(
  item: WikiEquipment | null,
  combatStyle: CombatStyle,
  meleeAttackType: string
): { attackBonus: number; strengthBonus: number } {
  if (!item) return { attackBonus: 0, strengthBonus: 0 };
  if (combatStyle === "ranged") {
    return { attackBonus: item.attackRanged, strengthBonus: item.rangedStrength };
  }
  if (combatStyle === "magic") {
    return { attackBonus: item.attackMagic, strengthBonus: item.magicDamage };
  }
  return {
    attackBonus: meleeAttackBonus(item, meleeAttackType),
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
  perSlot = 3,
  minGain = 0.01,
}: FindUpgradesOptions): SlotUpgrades[] {
  const deduped = dedupeEquipment(equipment);
  const baseDps = calculateDps(baseInput).dps;
  const hasTwoHander = Boolean(gear["2h"]);

  const results: SlotUpgrades[] = [];
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
