import { bucketQueryAll, type BucketWhere } from "./bucket";
import { getCached, setCache } from "./cache";

const CACHE_KEY = "wiki-equipment:v4";
const CACHE_TTL = 24 * 60 * 60 * 1000;

export type EquipmentSlot =
  | "head"
  | "body"
  | "legs"
  | "weapon"
  | "2h"
  | "shield"
  | "cape"
  | "neck"
  | "ammo"
  | "hands"
  | "feet"
  | "ring";

const EQUIPMENT_FIELDS = [
  "page_name",
  "page_name_sub",
  "equipment_slot",
  "stab_attack_bonus",
  "slash_attack_bonus",
  "crush_attack_bonus",
  "magic_attack_bonus",
  "range_attack_bonus",
  "stab_defence_bonus",
  "slash_defence_bonus",
  "crush_defence_bonus",
  "magic_defence_bonus",
  "range_defence_bonus",
  "strength_bonus",
  "ranged_strength_bonus",
  "magic_damage_bonus",
  "prayer_bonus",
  "combat_style",
] as const;

interface RawBucketEquipment {
  [key: string]: unknown;
  page_name: string;
  page_name_sub?: string;
  equipment_slot?: string;
  stab_attack_bonus?: string;
  slash_attack_bonus?: string;
  crush_attack_bonus?: string;
  magic_attack_bonus?: string;
  range_attack_bonus?: string;
  stab_defence_bonus?: string;
  slash_defence_bonus?: string;
  crush_defence_bonus?: string;
  magic_defence_bonus?: string;
  range_defence_bonus?: string;
  strength_bonus?: string;
  ranged_strength_bonus?: string;
  magic_damage_bonus?: string;
  prayer_bonus?: string;
  combat_style?: string;
}

export interface WikiEquipment {
  name: string;
  version: string | null;
  slot: EquipmentSlot;
  attackStab: number;
  attackSlash: number;
  attackCrush: number;
  attackMagic: number;
  attackRanged: number;
  defenceStab: number;
  defenceSlash: number;
  defenceCrush: number;
  defenceMagic: number;
  defenceRanged: number;
  strengthBonus: number;
  rangedStrength: number;
  magicDamage: number;
  prayerBonus: number;
  combatStyle: string | null;
  attackSpeed: number; // ticks (0 = unknown, typically 4-6)
}

function num(value: string | undefined): number {
  if (!value) return 0;
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
}

function normalizeSlot(raw: string | undefined): EquipmentSlot {
  if (!raw) return "weapon";
  const lower = raw.toLowerCase().trim();
  const slotMap: Record<string, EquipmentSlot> = {
    head: "head",
    body: "body",
    legs: "legs",
    weapon: "weapon",
    "2h": "2h",
    shield: "shield",
    cape: "cape",
    neck: "neck",
    ammo: "ammo",
    hands: "hands",
    feet: "feet",
    ring: "ring",
  };
  return slotMap[lower] ?? "weapon";
}

function toWikiEquipment(raw: RawBucketEquipment): WikiEquipment {
  return {
    name: raw.page_name,
    version: raw.page_name_sub || null,
    slot: normalizeSlot(raw.equipment_slot),
    attackStab: num(raw.stab_attack_bonus),
    attackSlash: num(raw.slash_attack_bonus),
    attackCrush: num(raw.crush_attack_bonus),
    attackMagic: num(raw.magic_attack_bonus),
    attackRanged: num(raw.range_attack_bonus),
    defenceStab: num(raw.stab_defence_bonus),
    defenceSlash: num(raw.slash_defence_bonus),
    defenceCrush: num(raw.crush_defence_bonus),
    defenceMagic: num(raw.magic_defence_bonus),
    defenceRanged: num(raw.range_defence_bonus),
    strengthBonus: num(raw.strength_bonus),
    rangedStrength: num(raw.ranged_strength_bonus),
    magicDamage: num(raw.magic_damage_bonus),
    prayerBonus: num(raw.prayer_bonus),
    combatStyle: raw.combat_style || null,
    attackSpeed: 0, // not available in infobox_bonuses bucket
  };
}

let equipmentPromise: Promise<WikiEquipment[]> | null = null;

export async function fetchAllEquipment(): Promise<WikiEquipment[]> {
  const cached = getCached<WikiEquipment[]>(CACHE_KEY, CACHE_TTL, {
    persist: true,
  });
  if (cached) return cached;

  if (!equipmentPromise) {
    equipmentPromise = bucketQueryAll<RawBucketEquipment>(
      "infobox_bonuses",
      [...EQUIPMENT_FIELDS]
    )
      .then((raw) => {
        const equipment = raw.map(toWikiEquipment);
        if (equipment.length > 0) setCache(CACHE_KEY, equipment, { persist: true });
        equipmentPromise = null;
        return equipment;
      })
      .catch((err: unknown) => {
        equipmentPromise = null;
        console.error("[RuneWise] Failed to fetch equipment:", err);
        throw err;
      });
  }

  return equipmentPromise;
}

export function searchEquipment(
  equipment: WikiEquipment[],
  query: string,
  slot?: EquipmentSlot,
  limit = 30
): WikiEquipment[] {
  let results = equipment;

  if (slot) {
    results = results.filter((e) => e.slot === slot);
  }

  if (query.trim()) {
    const lower = query.toLowerCase();
    results = results.filter((e) => e.name.toLowerCase().includes(lower));
  }

  return results.slice(0, limit);
}

export function getEquipmentBySlot(
  equipment: WikiEquipment[],
  slot: EquipmentSlot
): WikiEquipment[] {
  return equipment
    .filter((e) => e.slot === slot)
    .sort((a, b) => b.strengthBonus - a.strengthBonus);
}

export async function fetchEquipmentForSlot(
  slot: EquipmentSlot
): Promise<WikiEquipment[]> {
  const slotKey = `wiki-equipment-slot:${slot}`;
  const cached = getCached<WikiEquipment[]>(slotKey, CACHE_TTL, {
    persist: true,
  });
  if (cached) return cached;

  const raw = await bucketQueryAll<RawBucketEquipment>(
    "infobox_bonuses",
    [...EQUIPMENT_FIELDS],
    { field: "equipment_slot", value: slot } as BucketWhere
  );

  const equipment = raw.map(toWikiEquipment);
  setCache(slotKey, equipment, { persist: true });
  return equipment;
}
