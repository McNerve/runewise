import type { WikiEquipment, EquipmentSlot } from "../../lib/api/equipment";

export type CombatStyle = "melee" | "ranged" | "magic";
export type BonusMode = "equipment" | "manual";
export type EquippedGear = Partial<Record<EquipmentSlot | "2h", WikiEquipment>>;

export interface GearLoadout {
  name: string;
  combatStyle: CombatStyle;
  stanceIdx: number;
  prayerIdx: number;
  attackBonus: number;
  strengthBonus: number;
  attackSpeed: number;
  modifiers: string[];
  bonusMode?: BonusMode;
  gear?: Record<string, WikiEquipment>;
  // v2 snapshot fields
  contentTag?: string;
  note?: string;
  savedAt?: string;
  dps?: number;
  maxHit?: number;
  // v3: spell + spec selections persist with the loadout
  spellId?: string | null;
  specId?: string | null;
}

/** Complete calculator configuration — what a setup tab stores and what
 * loading a saved loadout applies. */
export interface SetupSnapshot {
  combatStyle: CombatStyle;
  stanceIdx: number;
  prayerIdx: number;
  bonusMode: BonusMode;
  attackBonus: number;
  strengthBonus: number;
  attackSpeed: number;
  gear: EquippedGear;
  modifiers: string[];
  spellId: string | null;
  specId: string | null;
}
