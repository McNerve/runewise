// OSRS weapon combat stances — varies by weapon category
// Each stance provides invisible level bonuses to attack/strength/defence
// Source: https://oldschool.runescape.wiki/w/Combat_Options

export interface WeaponStance {
  name: string;
  attackType: string; // stab, slash, crush, ranged, magic
  style: "accurate" | "aggressive" | "defensive" | "controlled" | "rapid" | "longrange" | "autocast";
  attackBonus: number;   // invisible level bonus to attack
  strengthBonus: number; // invisible level bonus to strength
  defenceBonus: number;  // invisible level bonus to defence
  speedMod: number;      // attack speed modifier (-1 = 1 tick faster, +1 = 1 tick slower)
}

export interface WeaponType {
  name: string;
  stances: WeaponStance[];
}

// Map from wiki combat_style field → weapon type
export const WEAPON_TYPES: Record<string, WeaponType> = {
  "2h Sword": {
    name: "2h Sword",
    stances: [
      { name: "Chop", attackType: "slash", style: "accurate", attackBonus: 3, strengthBonus: 0, defenceBonus: 0, speedMod: 0 },
      { name: "Slash", attackType: "slash", style: "aggressive", attackBonus: 0, strengthBonus: 3, defenceBonus: 0, speedMod: 0 },
      { name: "Smash", attackType: "crush", style: "aggressive", attackBonus: 0, strengthBonus: 3, defenceBonus: 0, speedMod: 0 },
      { name: "Block", attackType: "slash", style: "defensive", attackBonus: 0, strengthBonus: 0, defenceBonus: 3, speedMod: 0 },
    ],
  },
  "Axe": {
    name: "Axe",
    stances: [
      { name: "Chop", attackType: "slash", style: "accurate", attackBonus: 3, strengthBonus: 0, defenceBonus: 0, speedMod: 0 },
      { name: "Hack", attackType: "slash", style: "aggressive", attackBonus: 0, strengthBonus: 3, defenceBonus: 0, speedMod: 0 },
      { name: "Smash", attackType: "crush", style: "aggressive", attackBonus: 0, strengthBonus: 3, defenceBonus: 0, speedMod: 0 },
      { name: "Block", attackType: "slash", style: "defensive", attackBonus: 0, strengthBonus: 0, defenceBonus: 3, speedMod: 0 },
    ],
  },
  "Blunt": {
    name: "Blunt",
    stances: [
      { name: "Pound", attackType: "crush", style: "accurate", attackBonus: 3, strengthBonus: 0, defenceBonus: 0, speedMod: 0 },
      { name: "Pummel", attackType: "crush", style: "aggressive", attackBonus: 0, strengthBonus: 3, defenceBonus: 0, speedMod: 0 },
      { name: "Block", attackType: "crush", style: "defensive", attackBonus: 0, strengthBonus: 0, defenceBonus: 3, speedMod: 0 },
    ],
  },
  "Bow": {
    name: "Bow",
    stances: [
      { name: "Accurate", attackType: "ranged", style: "accurate", attackBonus: 3, strengthBonus: 0, defenceBonus: 0, speedMod: 0 },
      { name: "Rapid", attackType: "ranged", style: "rapid", attackBonus: 0, strengthBonus: 0, defenceBonus: 0, speedMod: -1 },
      { name: "Longrange", attackType: "ranged", style: "longrange", attackBonus: 0, strengthBonus: 0, defenceBonus: 3, speedMod: 0 },
    ],
  },
  "Chinchompa": {
    name: "Chinchompa",
    stances: [
      { name: "Short fuse", attackType: "ranged", style: "accurate", attackBonus: 3, strengthBonus: 0, defenceBonus: 0, speedMod: 0 },
      { name: "Medium fuse", attackType: "ranged", style: "rapid", attackBonus: 0, strengthBonus: 0, defenceBonus: 0, speedMod: -1 },
      { name: "Long fuse", attackType: "ranged", style: "longrange", attackBonus: 0, strengthBonus: 0, defenceBonus: 3, speedMod: 0 },
    ],
  },
  "Claw": {
    name: "Claw",
    stances: [
      { name: "Chop", attackType: "slash", style: "accurate", attackBonus: 3, strengthBonus: 0, defenceBonus: 0, speedMod: 0 },
      { name: "Slash", attackType: "slash", style: "aggressive", attackBonus: 0, strengthBonus: 3, defenceBonus: 0, speedMod: 0 },
      { name: "Lunge", attackType: "stab", style: "controlled", attackBonus: 1, strengthBonus: 1, defenceBonus: 1, speedMod: 0 },
      { name: "Block", attackType: "slash", style: "defensive", attackBonus: 0, strengthBonus: 0, defenceBonus: 3, speedMod: 0 },
    ],
  },
  "Crossbow": {
    name: "Crossbow",
    stances: [
      { name: "Accurate", attackType: "ranged", style: "accurate", attackBonus: 3, strengthBonus: 0, defenceBonus: 0, speedMod: 0 },
      { name: "Rapid", attackType: "ranged", style: "rapid", attackBonus: 0, strengthBonus: 0, defenceBonus: 0, speedMod: -1 },
      { name: "Longrange", attackType: "ranged", style: "longrange", attackBonus: 0, strengthBonus: 0, defenceBonus: 3, speedMod: 0 },
    ],
  },
  "Partisan": {
    name: "Partisan",
    stances: [
      { name: "Stab", attackType: "stab", style: "accurate", attackBonus: 3, strengthBonus: 0, defenceBonus: 0, speedMod: 0 },
      { name: "Lunge", attackType: "stab", style: "aggressive", attackBonus: 0, strengthBonus: 3, defenceBonus: 0, speedMod: 0 },
      { name: "Pound", attackType: "crush", style: "aggressive", attackBonus: 0, strengthBonus: 3, defenceBonus: 0, speedMod: 0 },
      { name: "Block", attackType: "stab", style: "defensive", attackBonus: 0, strengthBonus: 0, defenceBonus: 3, speedMod: 0 },
    ],
  },
  "Pickaxe": {
    name: "Pickaxe",
    stances: [
      { name: "Spike", attackType: "stab", style: "accurate", attackBonus: 3, strengthBonus: 0, defenceBonus: 0, speedMod: 0 },
      { name: "Impale", attackType: "stab", style: "aggressive", attackBonus: 0, strengthBonus: 3, defenceBonus: 0, speedMod: 0 },
      { name: "Smash", attackType: "crush", style: "aggressive", attackBonus: 0, strengthBonus: 3, defenceBonus: 0, speedMod: 0 },
      { name: "Block", attackType: "stab", style: "defensive", attackBonus: 0, strengthBonus: 0, defenceBonus: 3, speedMod: 0 },
    ],
  },
  "Polearm": {
    name: "Polearm",
    stances: [
      { name: "Jab", attackType: "stab", style: "controlled", attackBonus: 1, strengthBonus: 1, defenceBonus: 1, speedMod: 0 },
      { name: "Swipe", attackType: "slash", style: "aggressive", attackBonus: 0, strengthBonus: 3, defenceBonus: 0, speedMod: 0 },
      { name: "Fend", attackType: "stab", style: "defensive", attackBonus: 0, strengthBonus: 0, defenceBonus: 3, speedMod: 0 },
    ],
  },
  "Scythe": {
    name: "Scythe",
    stances: [
      { name: "Reap", attackType: "slash", style: "accurate", attackBonus: 3, strengthBonus: 0, defenceBonus: 0, speedMod: 0 },
      { name: "Chop", attackType: "slash", style: "aggressive", attackBonus: 0, strengthBonus: 3, defenceBonus: 0, speedMod: 0 },
      { name: "Jab", attackType: "crush", style: "aggressive", attackBonus: 0, strengthBonus: 3, defenceBonus: 0, speedMod: 0 },
      { name: "Block", attackType: "slash", style: "defensive", attackBonus: 0, strengthBonus: 0, defenceBonus: 3, speedMod: 0 },
    ],
  },
  "Slash Sword": {
    name: "Slash Sword",
    stances: [
      { name: "Chop", attackType: "slash", style: "accurate", attackBonus: 3, strengthBonus: 0, defenceBonus: 0, speedMod: 0 },
      { name: "Slash", attackType: "slash", style: "aggressive", attackBonus: 0, strengthBonus: 3, defenceBonus: 0, speedMod: 0 },
      { name: "Lunge", attackType: "stab", style: "controlled", attackBonus: 1, strengthBonus: 1, defenceBonus: 1, speedMod: 0 },
      { name: "Block", attackType: "slash", style: "defensive", attackBonus: 0, strengthBonus: 0, defenceBonus: 3, speedMod: 0 },
    ],
  },
  "Spear": {
    name: "Spear",
    stances: [
      { name: "Lunge", attackType: "stab", style: "controlled", attackBonus: 1, strengthBonus: 1, defenceBonus: 1, speedMod: 0 },
      { name: "Swipe", attackType: "slash", style: "controlled", attackBonus: 1, strengthBonus: 1, defenceBonus: 1, speedMod: 0 },
      { name: "Pound", attackType: "crush", style: "controlled", attackBonus: 1, strengthBonus: 1, defenceBonus: 1, speedMod: 0 },
      { name: "Block", attackType: "stab", style: "defensive", attackBonus: 0, strengthBonus: 0, defenceBonus: 3, speedMod: 0 },
    ],
  },
  "Spiked": {
    name: "Spiked",
    stances: [
      { name: "Pound", attackType: "crush", style: "accurate", attackBonus: 3, strengthBonus: 0, defenceBonus: 0, speedMod: 0 },
      { name: "Pummel", attackType: "crush", style: "aggressive", attackBonus: 0, strengthBonus: 3, defenceBonus: 0, speedMod: 0 },
      { name: "Spike", attackType: "stab", style: "controlled", attackBonus: 1, strengthBonus: 1, defenceBonus: 1, speedMod: 0 },
      { name: "Block", attackType: "crush", style: "defensive", attackBonus: 0, strengthBonus: 0, defenceBonus: 3, speedMod: 0 },
    ],
  },
  "Stab Sword": {
    name: "Stab Sword",
    stances: [
      { name: "Stab", attackType: "stab", style: "accurate", attackBonus: 3, strengthBonus: 0, defenceBonus: 0, speedMod: 0 },
      { name: "Lunge", attackType: "stab", style: "aggressive", attackBonus: 0, strengthBonus: 3, defenceBonus: 0, speedMod: 0 },
      { name: "Slash", attackType: "slash", style: "aggressive", attackBonus: 0, strengthBonus: 3, defenceBonus: 0, speedMod: 0 },
      { name: "Block", attackType: "stab", style: "defensive", attackBonus: 0, strengthBonus: 0, defenceBonus: 3, speedMod: 0 },
    ],
  },
  "Staff": {
    name: "Staff",
    stances: [
      { name: "Bash", attackType: "crush", style: "accurate", attackBonus: 3, strengthBonus: 0, defenceBonus: 0, speedMod: 0 },
      { name: "Pound", attackType: "crush", style: "aggressive", attackBonus: 0, strengthBonus: 3, defenceBonus: 0, speedMod: 0 },
      { name: "Focus", attackType: "crush", style: "defensive", attackBonus: 0, strengthBonus: 0, defenceBonus: 3, speedMod: 0 },
      { name: "Spell (Autocast)", attackType: "magic", style: "autocast", attackBonus: 0, strengthBonus: 0, defenceBonus: 0, speedMod: 0 },
    ],
  },
  "Powered Staff": {
    name: "Powered Staff",
    stances: [
      { name: "Accurate", attackType: "magic", style: "accurate", attackBonus: 3, strengthBonus: 0, defenceBonus: 0, speedMod: 0 },
      { name: "Longrange", attackType: "magic", style: "longrange", attackBonus: 0, strengthBonus: 0, defenceBonus: 3, speedMod: 0 },
    ],
  },
  "Thrown": {
    name: "Thrown",
    stances: [
      { name: "Accurate", attackType: "ranged", style: "accurate", attackBonus: 3, strengthBonus: 0, defenceBonus: 0, speedMod: 0 },
      { name: "Rapid", attackType: "ranged", style: "rapid", attackBonus: 0, strengthBonus: 0, defenceBonus: 0, speedMod: -1 },
      { name: "Longrange", attackType: "ranged", style: "longrange", attackBonus: 0, strengthBonus: 0, defenceBonus: 3, speedMod: 0 },
    ],
  },
  "Whip": {
    name: "Whip",
    stances: [
      { name: "Flick", attackType: "slash", style: "accurate", attackBonus: 3, strengthBonus: 0, defenceBonus: 0, speedMod: 0 },
      { name: "Lash", attackType: "slash", style: "controlled", attackBonus: 1, strengthBonus: 1, defenceBonus: 1, speedMod: 0 },
      { name: "Deflect", attackType: "slash", style: "defensive", attackBonus: 0, strengthBonus: 0, defenceBonus: 3, speedMod: 0 },
    ],
  },
  "Bulwark": {
    name: "Bulwark",
    stances: [
      { name: "Pummel", attackType: "crush", style: "accurate", attackBonus: 3, strengthBonus: 0, defenceBonus: 0, speedMod: 0 },
      { name: "Block", attackType: "crush", style: "defensive", attackBonus: 0, strengthBonus: 0, defenceBonus: 3, speedMod: 0 },
    ],
  },
};

// Default weapon type when we can't determine from equipment data
export const DEFAULT_WEAPON_TYPE = "Slash Sword";

// Get weapon type from combat_style field on equipment
export function getWeaponType(combatStyle: string | undefined): WeaponType {
  if (!combatStyle) return WEAPON_TYPES[DEFAULT_WEAPON_TYPE];
  return WEAPON_TYPES[combatStyle] ?? WEAPON_TYPES[DEFAULT_WEAPON_TYPE];
}
