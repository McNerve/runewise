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
  // Wildy
  { bossName: "Vet'ion", preset: "Max Mage", style: "magic", label: "Mage" },
  { bossName: "Calvar'ion", preset: "Max Mage", style: "magic", label: "Mage" },
  { bossName: "Venenatis", preset: "Max Ranged", style: "ranged", label: "Ranged" },
  { bossName: "Spindel", preset: "Max Ranged", style: "ranged", label: "Ranged" },
  { bossName: "Callisto", preset: "Max Ranged", style: "ranged", label: "Ranged" },
  { bossName: "Artio", preset: "Max Ranged", style: "ranged", label: "Ranged" },
  { bossName: "Chaos Elemental", preset: "Max Ranged", style: "ranged", label: "Ranged" },
  { bossName: "Chaos Fanatic", preset: "Budget Ranged", style: "ranged", label: "Budget" },
  { bossName: "Crazy Archaeologist", preset: "Budget Ranged", style: "ranged", label: "Budget" },
  { bossName: "Scorpia", preset: "Budget Mage", style: "magic", label: "Mage" },
  // Slayer extras
  { bossName: "Grotesque Guardians", preset: "Max Melee", style: "melee", label: "Melee" },
  { bossName: "Thermonuclear Smoke Devil", preset: "Max Ranged", style: "ranged", label: "Ranged" },
  // Other popular
  { bossName: "Nightmare", preset: "Max Mage", style: "magic", label: "Mage" },
  { bossName: "Phosani's Nightmare", preset: "Max Mage", style: "magic", label: "Mage" },
  { bossName: "Giant Mole", preset: "Budget Ranged", style: "ranged", label: "Budget" },
  { bossName: "Kalphite Queen", preset: "Max Melee", style: "melee", label: "Melee" },
  { bossName: "Skotizo", preset: "Max Melee", style: "melee", label: "Melee" },
  { bossName: "Sarachnis", preset: "Max Melee", style: "melee", label: "Crush" },
  { bossName: "Dagannoth Rex", preset: "Max Mage", style: "magic", label: "Mage" },
  { bossName: "Dagannoth Prime", preset: "Max Ranged", style: "ranged", label: "Ranged" },
  { bossName: "Dagannoth Supreme", preset: "Max Melee", style: "melee", label: "Melee" },
  { bossName: "Blood Moon", preset: "Max Melee", style: "melee", label: "Slash" },
  { bossName: "Blue Moon", preset: "Max Mage", style: "magic", label: "Mage" },
  { bossName: "Eclipse Moon", preset: "Max Ranged", style: "ranged", label: "Ranged" },
  { bossName: "Scurrius", preset: "Budget Ranged", style: "ranged", label: "Budget" },
  { bossName: "Obor", preset: "Early Melee", style: "melee", label: "Early" },
  { bossName: "Bryophyta", preset: "Early Melee", style: "melee", label: "Early" },
  { bossName: "Hespori", preset: "Budget Mage", style: "magic", label: "Mage" },
  { bossName: "Amoxliatl", preset: "Max Ranged", style: "ranged", label: "Ranged" },
  { bossName: "Hueycoatl", preset: "Max Ranged", style: "ranged", label: "Ranged" },
  { bossName: "TzTok-Jad", preset: "Max Ranged", style: "ranged", label: "Ranged" },
  { bossName: "TzKal-Zuk", preset: "Max Ranged", style: "ranged", label: "Tbow" },
  { bossName: "The Gauntlet", preset: "Max Melee", style: "melee", label: "Flexible" },
  { bossName: "The Corrupted Gauntlet", preset: "Max Melee", style: "melee", label: "Flexible" },
  // Fallback by weakness is handled in getMetaPacksForBoss
];

const ALIASES: Record<string, string> = {
  "theatre of blood: hard mode": "Theatre of Blood",
  "chambers of xeric: challenge mode": "Chambers of Xeric",
  "tombs of amascut: expert mode": "Tombs of Amascut: Expert Mode",
};

/** Weakness string → default pack when no curated entry exists. */
function packsFromWeakness(weakness?: string | null): BossMetaPack[] {
  if (!weakness) return [];
  const w = weakness.toLowerCase();
  if (w.includes("magic")) {
    return [
      { bossName: "", preset: "Max Mage", style: "magic", label: "Mage" },
      { bossName: "", preset: "Budget Mage", style: "magic", label: "Budget" },
    ];
  }
  if (w.includes("ranged") || w.includes("range")) {
    return [
      { bossName: "", preset: "Max Ranged", style: "ranged", label: "Ranged" },
      { bossName: "", preset: "Budget Ranged", style: "ranged", label: "Budget" },
    ];
  }
  if (w.includes("melee") || w.includes("stab") || w.includes("slash") || w.includes("crush")) {
    return [
      { bossName: "", preset: "Max Melee", style: "melee", label: "Melee" },
      { bossName: "", preset: "Budget Melee", style: "melee", label: "Budget" },
    ];
  }
  return [];
}

export function getMetaPacksForBoss(
  bossName: string,
  weakness?: string | null
): BossMetaPack[] {
  const key = bossName.toLowerCase();
  const direct = BOSS_META_PACKS.filter((p) => p.bossName.toLowerCase() === key);
  if (direct.length > 0) return direct;
  const alias = ALIASES[key];
  if (alias) {
    const aliased = BOSS_META_PACKS.filter(
      (p) => p.bossName.toLowerCase() === alias.toLowerCase()
    );
    if (aliased.length > 0) return aliased;
  }
  // Weakness-based fallback so every boss with a style tip gets a pack
  return packsFromWeakness(weakness).map((p) => ({ ...p, bossName }));
}
