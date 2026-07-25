/**
 * Best single-slot (and multi-step path) upgrades under remaining cash.
 */
import { calculateDps, type DpsInput } from "../../lib/formulas/dps";
import { findUpgrades } from "../dps-calc/upgradeFinder";
import type { WikiEquipment, EquipmentSlot } from "../../lib/api/equipment";
import type { CombatStyle, EquippedGear } from "../dps-calc/dpsTypes";

export interface LeftoverUpgrade {
  slot: string;
  item: WikiEquipment;
  price: number;
  dpsGain: number;
  dpsGainPct: number;
  newDps: number;
  newAccuracy?: number;
}

export interface LeftoverUpgradeOptions {
  gear: EquippedGear;
  combatStyle: CombatStyle;
  equipment: WikiEquipment[];
  priceOf: (name: string) => number | null;
  remainingBudget: number;
  baseInput: DpsInput;
  meleeAttackType?: string;
  stanceSpeedMod?: number;
  lowAccuracyThreshold?: number;
  maxSteps?: number;
}

function attackBonusOf(
  item: WikiEquipment | null | undefined,
  style: CombatStyle,
  meleeType: string
): number {
  if (!item) return 0;
  if (style === "ranged") return item.attackRanged;
  if (style === "magic") return item.attackMagic;
  if (meleeType === "stab") return item.attackStab;
  if (meleeType === "crush") return item.attackCrush;
  return item.attackSlash;
}

function strengthBonusOf(item: WikiEquipment | null | undefined, style: CombatStyle): number {
  if (!item) return 0;
  if (style === "ranged") return item.rangedStrength;
  if (style === "magic") return item.magicDamage;
  return item.strengthBonus;
}

function styleOkForWeapon(item: WikiEquipment, combatStyle: CombatStyle): boolean {
  const name = item.name.toLowerCase();
  if (combatStyle === "melee") {
    if (name.includes("bow") || name.includes("crossbow") || name.includes("blowpipe")) return false;
    if (name.includes("staff") && !name.includes("halberd")) return false;
  }
  if (combatStyle === "ranged") {
    if (
      name.includes("scimitar") ||
      name.includes("whip") ||
      name.includes("rapier") ||
      name.includes("scythe")
    )
      return false;
    if (name.includes("staff") || name.includes("trident") || name.includes("sang")) return false;
  }
  if (combatStyle === "magic") {
    if (
      name.includes("bow") ||
      name.includes("whip") ||
      name.includes("rapier") ||
      name.includes("scimitar")
    )
      return false;
  }
  return true;
}

export function findNextUpgradeUnderBudget(
  opts: LeftoverUpgradeOptions
): LeftoverUpgrade | null {
  return findUpgradePathUnderBudget({ ...opts, maxSteps: 1 })[0] ?? null;
}

export function findUpgradePathUnderBudget(opts: LeftoverUpgradeOptions): LeftoverUpgrade[] {
  const {
    combatStyle,
    equipment,
    priceOf,
    meleeAttackType = "slash",
    stanceSpeedMod,
    lowAccuracyThreshold = 0.4,
    maxSteps = 3,
  } = opts;

  let remaining = opts.remainingBudget;
  if (remaining <= 0 || maxSteps <= 0) return [];

  let gear: EquippedGear = { ...opts.gear };
  let baseInput: DpsInput = { ...opts.baseInput };
  const path: LeftoverUpgrade[] = [];

  for (let step = 0; step < maxSteps; step++) {
    if (remaining <= 0) break;

    const baseResult = calculateDps(baseInput);
    const baseAcc = baseResult.accuracy;
    const lowAcc = baseAcc < lowAccuracyThreshold;

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
    let bestScore = -Infinity;

    for (const { slot, upgrades, current } of slots) {
      for (const u of upgrades) {
        if ((slot === "weapon" || slot === "2h") && !styleOkForWeapon(u.item, combatStyle)) {
          continue;
        }
        const price = priceOf(u.item.name);
        if (price == null || price <= 0 || price > remaining) continue;

        const atkDelta =
          attackBonusOf(u.item, combatStyle, meleeAttackType) -
          attackBonusOf(current, combatStyle, meleeAttackType);
        const strDelta =
          strengthBonusOf(u.item, combatStyle) - strengthBonusOf(current, combatStyle);

        const trialInput: DpsInput = {
          ...baseInput,
          attackBonus: baseInput.attackBonus + atkDelta,
          strengthBonus: baseInput.strengthBonus + strDelta,
        };
        const trial = calculateDps(trialInput);

        if (lowAcc && trial.accuracy + 0.005 < baseAcc) continue;
        if (lowAcc && (slot === "weapon" || slot === "2h" || slot === "neck" || slot === "hands")) {
          if (atkDelta < 0) continue;
          if (atkDelta === 0 && trial.accuracy < lowAccuracyThreshold) continue;
        }

        const dpsGain = trial.dps - baseResult.dps;
        if (dpsGain < 0.01) continue;

        const score = lowAcc
          ? dpsGain * 10 + (trial.accuracy - baseAcc) * 80 + atkDelta * 0.5
          : dpsGain * 10 + (dpsGain / Math.max(price, 1)) * 1e5;

        if (score > bestScore) {
          bestScore = score;
          best = {
            slot,
            item: u.item,
            price,
            dpsGain,
            dpsGainPct: baseResult.dps > 0 ? (dpsGain / baseResult.dps) * 100 : 0,
            newDps: trial.dps,
            newAccuracy: trial.accuracy,
          };
        }
      }
    }

    if (!best) break;

    path.push(best);
    remaining -= best.price;

    const slotKey = best.slot as EquipmentSlot | "2h";
    const prev = gear[slotKey] ?? null;
    const nextGear: EquippedGear = { ...gear };
    if (best.slot === "2h") {
      delete nextGear.weapon;
      delete nextGear.shield;
      nextGear["2h"] = best.item;
    } else if (best.slot === "weapon") {
      delete nextGear["2h"];
      nextGear.weapon = best.item;
    } else {
      nextGear[slotKey] = best.item;
    }
    gear = nextGear;

    baseInput = {
      ...baseInput,
      attackBonus:
        baseInput.attackBonus +
        attackBonusOf(best.item, combatStyle, meleeAttackType) -
        attackBonusOf(prev, combatStyle, meleeAttackType),
      strengthBonus:
        baseInput.strengthBonus +
        strengthBonusOf(best.item, combatStyle) -
        strengthBonusOf(prev, combatStyle),
    };
  }

  return path;
}
