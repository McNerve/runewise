/**
 * Combat spell data for the DPS Calculator.
 *
 * Base max hit is the spell's inherent maximum before gear magic damage %.
 * Magic damage % from gear is applied as:
 *   maxHit = floor(baseMaxHit * (1 + magicDamageBonus / 100))
 *
 * Powered staves (Trident, Sanguinesti, Tumeken's Shadow) are NOT listed here —
 * their max hit scales with Magic level and is calculated separately.
 *
 * Sources: OSRS Wiki spell infoboxes, verified against wiki DPS calculator.
 */

export type SpellElement = "fire" | "water" | "earth" | "air" | "none";
export type CombatSpellbook = "standard" | "ancient" | "arceuus";

export interface CombatSpell {
  id: string;
  name: string;
  spellbook: CombatSpellbook;
  baseMaxHit: number;
  magicLevel: number;
  element: SpellElement;
  /** true = can be set as autocast on a compatible staff */
  autocasting: boolean;
  /** Short note for edge-case mechanics */
  notes?: string;
}

export const COMBAT_SPELLS: CombatSpell[] = [
  // ─── Standard Spellbook — Strike series ─────────────────────────────────
  {
    id: "wind_strike",
    name: "Wind Strike",
    spellbook: "standard",
    baseMaxHit: 2,
    magicLevel: 1,
    element: "air",
    autocasting: true,
  },
  {
    id: "water_strike",
    name: "Water Strike",
    spellbook: "standard",
    baseMaxHit: 4,
    magicLevel: 5,
    element: "water",
    autocasting: true,
  },
  {
    id: "earth_strike",
    name: "Earth Strike",
    spellbook: "standard",
    baseMaxHit: 6,
    magicLevel: 9,
    element: "earth",
    autocasting: true,
  },
  {
    id: "fire_strike",
    name: "Fire Strike",
    spellbook: "standard",
    baseMaxHit: 8,
    magicLevel: 13,
    element: "fire",
    autocasting: true,
  },

  // ─── Standard Spellbook — Bolt series ───────────────────────────────────
  {
    id: "wind_bolt",
    name: "Wind Bolt",
    spellbook: "standard",
    baseMaxHit: 9,
    magicLevel: 17,
    element: "air",
    autocasting: true,
  },
  {
    id: "water_bolt",
    name: "Water Bolt",
    spellbook: "standard",
    baseMaxHit: 10,
    magicLevel: 23,
    element: "water",
    autocasting: true,
  },
  {
    id: "earth_bolt",
    name: "Earth Bolt",
    spellbook: "standard",
    baseMaxHit: 11,
    magicLevel: 29,
    element: "earth",
    autocasting: true,
  },
  {
    id: "fire_bolt",
    name: "Fire Bolt",
    spellbook: "standard",
    baseMaxHit: 12,
    magicLevel: 35,
    element: "fire",
    autocasting: true,
    notes: "Tome of Fire applies only to Fire spells — Fire Bolt, Blast, Wave, Surge.",
  },

  // ─── Standard Spellbook — Blast series ──────────────────────────────────
  {
    id: "wind_blast",
    name: "Wind Blast",
    spellbook: "standard",
    baseMaxHit: 13,
    magicLevel: 41,
    element: "air",
    autocasting: true,
  },
  {
    id: "water_blast",
    name: "Water Blast",
    spellbook: "standard",
    baseMaxHit: 14,
    magicLevel: 47,
    element: "water",
    autocasting: true,
  },
  {
    id: "earth_blast",
    name: "Earth Blast",
    spellbook: "standard",
    baseMaxHit: 15,
    magicLevel: 53,
    element: "earth",
    autocasting: true,
  },
  {
    id: "fire_blast",
    name: "Fire Blast",
    spellbook: "standard",
    baseMaxHit: 16,
    magicLevel: 59,
    element: "fire",
    autocasting: true,
  },

  // ─── Standard Spellbook — Wave series ───────────────────────────────────
  {
    id: "wind_wave",
    name: "Wind Wave",
    spellbook: "standard",
    baseMaxHit: 17,
    magicLevel: 62,
    element: "air",
    autocasting: true,
  },
  {
    id: "water_wave",
    name: "Water Wave",
    spellbook: "standard",
    baseMaxHit: 18,
    magicLevel: 65,
    element: "water",
    autocasting: true,
  },
  {
    id: "earth_wave",
    name: "Earth Wave",
    spellbook: "standard",
    baseMaxHit: 19,
    magicLevel: 70,
    element: "earth",
    autocasting: true,
  },
  {
    id: "fire_wave",
    name: "Fire Wave",
    spellbook: "standard",
    baseMaxHit: 20,
    magicLevel: 75,
    element: "fire",
    autocasting: true,
  },

  // ─── Standard Spellbook — Surge series ──────────────────────────────────
  {
    id: "wind_surge",
    name: "Wind Surge",
    spellbook: "standard",
    baseMaxHit: 21,
    magicLevel: 81,
    element: "air",
    autocasting: true,
  },
  {
    id: "water_surge",
    name: "Water Surge",
    spellbook: "standard",
    baseMaxHit: 22,
    magicLevel: 85,
    element: "water",
    autocasting: true,
  },
  {
    id: "earth_surge",
    name: "Earth Surge",
    spellbook: "standard",
    baseMaxHit: 23,
    magicLevel: 90,
    element: "earth",
    autocasting: true,
  },
  {
    id: "fire_surge",
    name: "Fire Surge",
    spellbook: "standard",
    baseMaxHit: 24,
    magicLevel: 95,
    element: "fire",
    autocasting: true,
  },

  // ─── Standard Spellbook — God spells ────────────────────────────────────
  {
    id: "flames_of_zamorak",
    name: "Flames of Zamorak",
    spellbook: "standard",
    baseMaxHit: 20,
    magicLevel: 60,
    element: "fire",
    autocasting: true,
    notes: "Requires Zamorak staff or charged god cape to autocast. Drains target's Magic by 5% of max on hit.",
  },
  {
    id: "claws_of_guthix",
    name: "Claws of Guthix",
    spellbook: "standard",
    baseMaxHit: 20,
    magicLevel: 60,
    element: "none",
    autocasting: true,
    notes: "Requires Guthix staff or charged Guthix cape. Drains target's Defence by 5% on hit.",
  },
  {
    id: "saradomin_strike",
    name: "Saradomin Strike",
    spellbook: "standard",
    baseMaxHit: 20,
    magicLevel: 60,
    element: "none",
    autocasting: true,
    notes: "Requires Saradomin staff or charged Saradomin cape. Drains target's Prayer by 1 on hit.",
  },

  // ─── Standard Spellbook — One-off combat spells ─────────────────────────
  {
    id: "ibans_blast",
    name: "Iban's Blast",
    spellbook: "standard",
    baseMaxHit: 25,
    magicLevel: 50,
    element: "none",
    autocasting: true,
    notes: "Autocastable from Iban's staff only. Upgraded staff allows 2,500 casts instead of 1,000.",
  },
  {
    id: "magic_dart",
    name: "Magic Dart",
    spellbook: "standard",
    // Base max hit = floor(magicLevel / 10) + 10. At 99: 19. Represents the
    // level-scaling component; this value (19) is for 99 Magic.
    baseMaxHit: 19,
    magicLevel: 50,
    element: "none",
    autocasting: true,
    notes: "Autocastable from Slayer's staff / Slayer's staff (e) only. Max hit scales: floor(magicLevel / 10) + 10. At 99 magic = 19. Slayer helm (i) / Black mask (i) apply their multiplier.",
  },
  {
    id: "crumble_undead",
    name: "Crumble Undead",
    spellbook: "standard",
    baseMaxHit: 15,
    magicLevel: 39,
    element: "none",
    autocasting: false,
    notes: "Only hittable on undead targets. Cannot be autocast — must be manually cast each tick. Extra damage on undead monsters.",
  },

  // ─── Ancient Magicks — Rush (4 ticks, single-target) ────────────────────
  {
    id: "smoke_rush",
    name: "Smoke Rush",
    spellbook: "ancient",
    baseMaxHit: 13,
    magicLevel: 50,
    element: "fire",
    autocasting: false,
    notes: "Poisons target (starting at 2). Ancient Magicks require Ancient staff, Master wand, Kodai wand, or Nightmare staff to autocast — but Rushes are not autocastable; they must be manually selected.",
  },
  {
    id: "shadow_rush",
    name: "Shadow Rush",
    spellbook: "ancient",
    baseMaxHit: 14,
    magicLevel: 52,
    element: "none",
    autocasting: false,
    notes: "Reduces target's Attack by 10% on hit.",
  },
  {
    id: "blood_rush",
    name: "Blood Rush",
    spellbook: "ancient",
    baseMaxHit: 15,
    magicLevel: 56,
    element: "none",
    autocasting: false,
    notes: "Heals caster for 25% of damage dealt.",
  },
  {
    id: "ice_rush",
    name: "Ice Rush",
    spellbook: "ancient",
    baseMaxHit: 16,
    magicLevel: 58,
    element: "water",
    autocasting: false,
    notes: "Freezes target for 8 ticks (4.8s).",
  },

  // ─── Ancient Magicks — Burst (4 ticks, 3x3 AoE) ─────────────────────────
  {
    id: "smoke_burst",
    name: "Smoke Burst",
    spellbook: "ancient",
    baseMaxHit: 17,
    magicLevel: 62,
    element: "fire",
    autocasting: false,
    notes: "3×3 AoE. Poisons all targets hit (starting at 2).",
  },
  {
    id: "shadow_burst",
    name: "Shadow Burst",
    spellbook: "ancient",
    baseMaxHit: 18,
    magicLevel: 64,
    element: "none",
    autocasting: false,
    notes: "3×3 AoE. Reduces target's Agility by 10% on hit (minor PvM use).",
  },
  {
    id: "blood_burst",
    name: "Blood Burst",
    spellbook: "ancient",
    baseMaxHit: 21,
    magicLevel: 68,
    element: "none",
    autocasting: false,
    notes: "3×3 AoE. Heals caster for 25% of damage dealt per target hit.",
  },
  {
    id: "ice_burst",
    name: "Ice Burst",
    spellbook: "ancient",
    baseMaxHit: 22,
    magicLevel: 70,
    element: "water",
    autocasting: false,
    notes: "3×3 AoE. Freezes all targets for 16 ticks (9.6s). Core Barrows/slayer AoE freeze.",
  },

  // ─── Ancient Magicks — Blitz (4 ticks, single-target) ───────────────────
  {
    id: "smoke_blitz",
    name: "Smoke Blitz",
    spellbook: "ancient",
    baseMaxHit: 23,
    magicLevel: 74,
    element: "fire",
    autocasting: false,
    notes: "Poisons target (starting at 4).",
  },
  {
    id: "shadow_blitz",
    name: "Shadow Blitz",
    spellbook: "ancient",
    baseMaxHit: 24,
    magicLevel: 76,
    element: "none",
    autocasting: false,
    notes: "Reduces target's Attack by 15% on hit.",
  },
  {
    id: "blood_blitz",
    name: "Blood Blitz",
    spellbook: "ancient",
    baseMaxHit: 25,
    magicLevel: 80,
    element: "none",
    autocasting: false,
    notes: "Heals caster for 25% of damage dealt. Popular PvM single-target heal.",
  },
  {
    id: "ice_blitz",
    name: "Ice Blitz",
    spellbook: "ancient",
    baseMaxHit: 26,
    magicLevel: 82,
    element: "water",
    autocasting: false,
    notes: "Freezes target for 24 ticks (14.4s). Common for NH PvP and Jad healing melees.",
  },

  // ─── Ancient Magicks — Barrage (4 ticks, 3x3 AoE) ──────────────────────
  {
    id: "smoke_barrage",
    name: "Smoke Barrage",
    spellbook: "ancient",
    baseMaxHit: 27,
    magicLevel: 86,
    element: "fire",
    autocasting: false,
    notes: "3×3 AoE. Poisons all targets hit (starting at 4).",
  },
  {
    id: "shadow_barrage",
    name: "Shadow Barrage",
    spellbook: "ancient",
    baseMaxHit: 28,
    magicLevel: 88,
    element: "none",
    autocasting: false,
    notes: "3×3 AoE. Reduces target's Attack by 15% on hit.",
  },
  {
    id: "blood_barrage",
    name: "Blood Barrage",
    spellbook: "ancient",
    baseMaxHit: 29,
    magicLevel: 92,
    element: "none",
    autocasting: false,
    notes: "3×3 AoE. Heals caster for 25% of damage per target. Best AoE sustain spell.",
  },
  {
    id: "ice_barrage",
    name: "Ice Barrage",
    spellbook: "ancient",
    baseMaxHit: 30,
    magicLevel: 94,
    element: "water",
    autocasting: false,
    notes: "3×3 AoE. Freezes all targets for 32 ticks (19.2s). The premier AoE freeze; staple for NMZ, slayer, CoX, ToB.",
  },

  // ─── Arceuus Spellbook — Demonbane spells ───────────────────────────────
  {
    id: "inferior_demonbane",
    name: "Inferior Demonbane",
    spellbook: "arceuus",
    baseMaxHit: 16,
    magicLevel: 44,
    element: "none",
    autocasting: false,
    notes: "Only damages demons. No magic damage % interaction confirmed — applies normally.",
  },
  {
    id: "superior_demonbane",
    name: "Superior Demonbane",
    spellbook: "arceuus",
    baseMaxHit: 23,
    magicLevel: 62,
    element: "none",
    autocasting: false,
    notes: "Only damages demons.",
  },
  {
    id: "dark_demonbane",
    name: "Dark Demonbane",
    spellbook: "arceuus",
    baseMaxHit: 30,
    magicLevel: 82,
    element: "none",
    autocasting: false,
    notes: "Only damages demons. Highest demonbane max hit.",
  },

  // ─── Arceuus Spellbook — Grasp spells ───────────────────────────────────
  {
    id: "ghostly_grasp",
    name: "Ghostly Grasp",
    spellbook: "arceuus",
    baseMaxHit: 12,
    magicLevel: 35,
    element: "none",
    autocasting: false,
    notes: "Binds target in place for 3 ticks (1.8s). Only usable on undead targets.",
  },
  {
    id: "skeletal_grasp",
    name: "Skeletal Grasp",
    spellbook: "arceuus",
    baseMaxHit: 17,
    magicLevel: 56,
    element: "none",
    autocasting: false,
    notes: "Binds target for 5 ticks (3.0s). Only usable on undead targets.",
  },
  {
    id: "undead_grasp",
    name: "Undead Grasp",
    spellbook: "arceuus",
    baseMaxHit: 24,
    magicLevel: 79,
    element: "none",
    autocasting: false,
    notes: "Binds target for 8 ticks (4.8s). Only usable on undead targets.",
  },
];

/**
 * Returns all spells for a given spellbook.
 */
export function getSpellsByBook(book: CombatSpellbook): CombatSpell[] {
  return COMBAT_SPELLS.filter((s) => s.spellbook === book);
}

/**
 * Returns all spells that can be set to autocast on a staff.
 */
export function getAutocastableSpells(): CombatSpell[] {
  return COMBAT_SPELLS.filter((s) => s.autocasting);
}

/**
 * Returns all spells of a given elemental type (relevant for Tome of Fire,
 * Tome of Water, elemental weakness checks, etc.).
 */
export function getSpellsByElement(element: SpellElement): CombatSpell[] {
  return COMBAT_SPELLS.filter((s) => s.element === element);
}

/**
 * Calculates final max hit after applying the gear magic damage % bonus.
 *
 * Formula: floor(baseMaxHit * (1 + magicDamageBonus / 100))
 *
 * @param baseMaxHit    The spell's inherent max damage (from COMBAT_SPELLS)
 * @param magicDamage   Total magic damage % from all equipped gear (e.g. 25 for 25%)
 */
export function spellMaxHit(baseMaxHit: number, magicDamage: number): number {
  return Math.floor(baseMaxHit * (1 + magicDamage / 100));
}

/**
 * Magic Dart has a level-scaling base max hit.
 * This replaces the static value when using Magic Dart.
 *
 * Formula: floor(magicLevel / 10) + 10
 */
export function magicDartBaseMaxHit(magicLevel: number): number {
  return Math.floor(magicLevel / 10) + 10;
}
