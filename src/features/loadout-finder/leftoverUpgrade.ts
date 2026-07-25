/**
 * Best single-slot upgrade under remaining cash after a budget loadout.
 */
import { findUpgrades } from "../dps-calc/upgradeFinder";
import type { WikiEquipment } from "../../lib/api/equipment";
import type { CombatStyle, EquippedGear } from "../dps-calc/dpsTypes";
import type { DpsInput } from "../../lib/formulas/dps";

export interface LeftoverUpgrade {
  slot: string;
  item: WikiEquipment;
  price: number;
  dpsGain: number;
  dpsGainPct: number;
  newDps: number;
}

export interface LeftoverUpgradeOptions {
  gear: EquippedGear;
  combatStyle: CombatStyle;
  equipment: WikiEquipment[];
  priceOf: (name: string) => number | null;
  /** Cash left after paying for the current setup. */
  remainingBudget: number;
  baseInput: DpsInput;
  meleeAttackType?: string;
  stanceSpeedMod?: number;
}

export function findNextUpgradeUnderBudget(
  opts: LeftoverUpgradeOptions
): LeftoverUpgrade | null {
  const {
    gear,
    combatStyle,
    equipment,
    priceOf,
    remainingBudget,
    baseInput,
    meleeAttackType = "slash",
    stanceSpeedMod,
  } = opts;

  if (remainingBudget <= 0) return null;

  const slots = findUpgrades({
    baseInput,
    gear,
    equipment,
    combatStyle,
    meleeAttackType,
    stanceSpeedMod,
    perSlot: 12,
    minGain: 0.01,
  });

  let best: LeftoverUpgrade | null = null;

  for (const { slot, upgrades } of slots) {
    for (const u of upgrades) {
      const price = priceOf(u.item.name);
      if (price == null || price <= 0 || price > remainingBudget) continue;
      if (!best || u.dpsGain > best.dpsGain) {
        best = {
          slot,
          item: u.item,
          price,
          dpsGain: u.dpsGain,
          dpsGainPct: u.dpsGainPct,
          newDps: u.dps,
        };
      }
    }
  }

  return best;
}
