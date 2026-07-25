/**
 * Curated meta loadouts per boss — maps to GEAR_PRESETS for one-click DPS.
 * Not exhaustive BiS; "good default" packs for common bosses.
 */
export interface BossMetaPack {
  /** Must match a BOSSES[].name (or be resolved via aliases). */
  bossName: string;
  /** GEAR_PRESETS[].name */
  preset: string;
  style: "melee" | "ranged" | "magic";
  /** Short chip label (defaults to style). */
  label?: string;
  note?: string;
}

export const BOSS_META_PACKS: BossMetaPack[] = [
  // Dragons
  {
    bossName: "Vorkath",
    preset: "DHCB Dragons",
    style: "ranged",
    label: "DHCB",
    note: "Dragonbane ranged",
  },
  {
    bossName: "Vorkath",
    preset: "DHL Dragonbane",
    style: "melee",
    label: "DHL",
    note: "Dragonbane melee",
  },
  {
    bossName: "King Black Dragon",
    preset: "DHCB Dragons",
    style: "ranged",
    label: "DHCB",
  },
  // Zulrah
  {
    bossName: "Zulrah",
    preset: "Max Mage",
    style: "magic",
    label: "Shadow",
    note: "Mage form",
  },
  {
    bossName: "Zulrah",
    preset: "Blowpipe",
    style: "ranged",
    label: "BP",
    note: "Ranged form",
  },
  // GWD
  {
    bossName: "General Graardor",
    preset: "Max Ranged",
    style: "ranged",
    label: "Tbow",
    note: "Safespot / melee room",
  },
  {
    bossName: "General Graardor",
    preset: "Budget Ranged",
    style: "ranged",
    label: "Budget",
  },
  {
    bossName: "Kree'arra",
    preset: "Max Mage",
    style: "magic",
    label: "Shadow",
  },
  {
    bossName: "Commander Zilyana",
    preset: "Max Ranged",
    style: "ranged",
    label: "Tbow",
  },
  {
    bossName: "K'ril Tsutsaroth",
    preset: "Max Melee",
    style: "melee",
    label: "Melee",
  },
  {
    bossName: "Nex",
    preset: "Max Ranged",
    style: "ranged",
    label: "Tbow",
  },
  // Slayer
  {
    bossName: "Cerberus",
    preset: "Max Melee",
    style: "melee",
    label: "Melee",
  },
  {
    bossName: "Alchemical Hydra",
    preset: "Max Ranged",
    style: "ranged",
    label: "Tbow",
  },
  {
    bossName: "Kraken",
    preset: "Trident",
    style: "magic",
    label: "Trident",
  },
  {
    bossName: "Abyssal Sire",
    preset: "Max Ranged",
    style: "ranged",
    label: "Ranged",
  },
  {
    bossName: "Araxxor",
    preset: "Max Ranged",
    style: "ranged",
    label: "Ranged",
  },
  // Other
  {
    bossName: "Corporeal Beast",
    preset: "Max Melee",
    style: "melee",
    label: "Spear style",
    note: "Prefer spear / halberd in DPS",
  },
  {
    bossName: "Phantom Muspah",
    preset: "Max Ranged",
    style: "ranged",
    label: "Ranged",
  },
  {
    bossName: "Duke Sucellus",
    preset: "Max Melee",
    style: "melee",
    label: "Melee",
  },
  {
    bossName: "Vardorvis",
    preset: "Max Melee",
    style: "melee",
    label: "Slash",
  },
  {
    bossName: "The Whisperer",
    preset: "Max Mage",
    style: "magic",
    label: "Mage",
  },
  {
    bossName: "The Leviathan",
    preset: "Max Ranged",
    style: "ranged",
    label: "Ranged",
  },
  // Raids — generic BiS pointers
  {
    bossName: "Chambers of Xeric",
    preset: "Max Ranged",
    style: "ranged",
    label: "Tbow",
  },
  {
    bossName: "Chambers of Xeric",
    preset: "Scythe (Multi)",
    style: "melee",
    label: "Scythe",
  },
  {
    bossName: "Theatre of Blood",
    preset: "Scythe (Multi)",
    style: "melee",
    label: "Scythe",
  },
  {
    bossName: "Tombs of Amascut",
    preset: "Fang ToA",
    style: "melee",
    label: "Fang",
  },
  {
    bossName: "Tombs of Amascut: Expert Mode",
    preset: "Fang ToA",
    style: "melee",
    label: "Fang",
  },
  {
    bossName: "Tombs of Amascut",
    preset: "Max Mage",
    style: "magic",
    label: "Shadow",
  },
];

const ALIASES: Record<string, string> = {
  "theatre of blood: hard mode": "Theatre of Blood",
  "chambers of xeric: challenge mode": "Chambers of Xeric",
  "tombs of amascut: expert mode": "Tombs of Amascut: Expert Mode",
};

export function getMetaPacksForBoss(bossName: string): BossMetaPack[] {
  const key = bossName.toLowerCase();
  const direct = BOSS_META_PACKS.filter((p) => p.bossName.toLowerCase() === key);
  if (direct.length > 0) return direct;
  const alias = ALIASES[key];
  if (alias) {
    return BOSS_META_PACKS.filter((p) => p.bossName.toLowerCase() === alias.toLowerCase());
  }
  return [];
}
