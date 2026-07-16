import {
  DPS_MODIFIERS,
  type DpsModifier,
  type DpsInput,
} from "../../lib/formulas/dps";
import { PRAYERS } from "../../lib/data/prayers";
import type { WikiMonster } from "../../lib/api/monsters";
import type { WikiEquipment } from "../../lib/api/equipment";
import { getWeaponType, type WeaponStance } from "../../lib/data/weapon-stances";
import { knownWeaponSpeed } from "../../lib/data/weapon-speeds";
import {
  COMBAT_SPELLS,
  magicDartBaseMaxHit,
} from "../../lib/data/combat-spells";
import type {
  CombatStyle,
  EquippedGear,
  GearLoadout,
  SetupSnapshot,
} from "./dpsTypes";

export function loadoutToSnapshot(loadout: GearLoadout): SetupSnapshot {
  return {
    combatStyle: loadout.combatStyle,
    stanceIdx: loadout.stanceIdx,
    prayerIdx: loadout.prayerIdx,
    bonusMode: loadout.bonusMode ?? (loadout.gear ? "equipment" : "manual"),
    attackBonus: loadout.attackBonus,
    strengthBonus: loadout.strengthBonus,
    attackSpeed: loadout.attackSpeed,
    gear: (loadout.gear as EquippedGear) ?? {},
    modifiers: [...loadout.modifiers],
    spellId: loadout.spellId ?? null,
    specId: loadout.specId ?? null,
  };
}

export function sumGearBonuses(gear: EquippedGear): {
  attackStab: number;
  attackSlash: number;
  attackCrush: number;
  strengthBonus: number;
  attackSpeed: number;
  rangedBonus: number;
  rangedStrength: number;
  magicBonus: number;
  magicDamage: number;
  prayer: number;
  defenceStab: number;
  defenceSlash: number;
  defenceCrush: number;
  defenceMagic: number;
  defenceRanged: number;
} {
  const items = Object.values(gear).filter(Boolean) as WikiEquipment[];
  const totals = {
    attackStab: 0,
    attackSlash: 0,
    attackCrush: 0,
    strengthBonus: 0,
    attackSpeed: 0,
    rangedBonus: 0,
    rangedStrength: 0,
    magicBonus: 0,
    magicDamage: 0,
    prayer: 0,
    defenceStab: 0,
    defenceSlash: 0,
    defenceCrush: 0,
    defenceMagic: 0,
    defenceRanged: 0,
  };
  for (const i of items) {
    totals.attackStab += i.attackStab;
    totals.attackSlash += i.attackSlash;
    totals.attackCrush += i.attackCrush;
    totals.strengthBonus += i.strengthBonus;
    totals.rangedBonus += i.attackRanged;
    totals.rangedStrength += i.rangedStrength;
    totals.magicBonus += i.attackMagic;
    totals.magicDamage += i.magicDamage;
    totals.prayer += i.prayerBonus;
    totals.defenceStab += i.defenceStab;
    totals.defenceSlash += i.defenceSlash;
    totals.defenceCrush += i.defenceCrush;
    totals.defenceMagic += i.defenceMagic;
    totals.defenceRanged += i.defenceRanged;
  }
  return totals;
}

// OSRS uses only the attack bonus matching the weapon's current attack type
// (stab/slash/crush), never the sum of all three.
export function meleeAttackBonus(
  b: { attackStab: number; attackSlash: number; attackCrush: number },
  attackType: string
): number {
  if (attackType === "stab") return b.attackStab;
  if (attackType === "crush") return b.attackCrush;
  return b.attackSlash;
}

export const GENERIC_STANCES: Record<CombatStyle, WeaponStance[]> = {
  melee: getWeaponType("Slash Sword").stances,
  ranged: getWeaponType("Bow").stances,
  magic: getWeaponType("Staff").stances,
};

export const DEFAULT_SPEED: Record<CombatStyle, number> = {
  melee: 4,
  ranged: 5,
  magic: 5,
};

export function getDefBonus(m: WikiMonster, style: CombatStyle, meleeType?: string): number {
  if (style === "ranged") return m.defRanged;
  if (style === "magic") return m.defMagic;
  // Melee uses the defence bonus matching the attacker's attack type;
  // default to slash (the most common melee type) when unspecified.
  if (meleeType === "stab") return m.defStab;
  if (meleeType === "crush") return m.defCrush;
  return m.defSlash;
}

/** Builds the DPS input for a stored setup snapshot, mirroring the live
 * derivations (gear bonuses, weapon stances, verified speeds, spells). */
export function snapshotDpsInput(
  snap: SetupSnapshot,
  ctx: {
    attackLevel: number;
    strengthLevel: number;
    rangedLevel: number;
    magicLevel: number;
    targetDefLevel: number;
    targetHp: number;
    targetMagicLevel?: number;
    targetDefBonusFor: (style: CombatStyle, attackType: string) => number;
    defReductions: number;
    tbowRaidCap: boolean;
  }
): DpsInput {
  const weapon = snap.gear["weapon"] ?? snap.gear["2h"] ?? null;
  const useEquipment = snap.bonusMode === "equipment";
  const stances = useEquipment && weapon?.combatStyle
    ? getWeaponType(weapon.combatStyle).stances
    : GENERIC_STANCES[snap.combatStyle];
  const stance = stances[snap.stanceIdx] ?? stances[0];
  const stylePrayers = PRAYERS.filter((p) => p.style === snap.combatStyle);
  const prayer = stylePrayers[snap.prayerIdx] ?? stylePrayers[0];

  const bonuses = sumGearBonuses(snap.gear);
  const attackBonus = useEquipment
    ? snap.combatStyle === "ranged"
      ? bonuses.rangedBonus
      : snap.combatStyle === "magic"
        ? bonuses.magicBonus
        : meleeAttackBonus(bonuses, stance.attackType)
    : snap.attackBonus;
  const strengthBonus = useEquipment
    ? snap.combatStyle === "ranged"
      ? bonuses.rangedStrength
      : snap.combatStyle === "magic"
        ? bonuses.magicDamage
        : bonuses.strengthBonus
    : snap.strengthBonus;

  const weaponSpeed = weapon ? weapon.attackSpeed || knownWeaponSpeed(weapon.name) || 0 : 0;
  const attackSpeed = useEquipment && weaponSpeed > 0
    ? weaponSpeed + (stance.speedMod ?? 0)
    : snap.attackSpeed;

  const spell = snap.combatStyle === "magic" && snap.spellId
    ? COMBAT_SPELLS.find((s) => s.id === snap.spellId) ?? null
    : null;
  const spellBaseMaxHit = spell
    ? spell.id === "magic_dart"
      ? magicDartBaseMaxHit(ctx.magicLevel)
      : spell.levelScaling
        ? spell.levelScaling(ctx.magicLevel)
        : spell.baseMaxHit
    : undefined;

  return {
    attackLevel: ctx.attackLevel,
    strengthLevel: ctx.strengthLevel,
    rangedLevel: ctx.rangedLevel,
    magicLevel: ctx.magicLevel,
    attackBonus,
    strengthBonus,
    prayerAttackMult: prayer.attackMult,
    prayerStrengthMult: prayer.strengthMult,
    stanceAttackBonus: stance.attackBonus,
    stanceStrengthBonus: stance.strengthBonus,
    attackSpeed,
    combatStyle: snap.combatStyle,
    targetDefLevel: ctx.targetDefLevel,
    targetDefBonus: ctx.targetDefBonusFor(snap.combatStyle, stance.attackType),
    targetHp: ctx.targetHp,
    targetMagicLevel: ctx.targetMagicLevel,
    modifiers: [...snap.modifiers]
      .map((id) => DPS_MODIFIERS[id])
      .filter((m): m is DpsModifier => m != null),
    defReductions: ctx.defReductions,
    spellBaseMaxHit,
    tbowRaidCap: ctx.tbowRaidCap,
  };
}
