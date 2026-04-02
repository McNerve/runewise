export interface BossInfo {
  name: string;
  wikiPage: string;
  category: string;
  combatLevel?: number;
  hitpoints?: number;
  maxHit?: number;
  weakness?: string;
}

export const BOSSES: BossInfo[] = [
  // Raids
  { name: "Chambers of Xeric", wikiPage: "Chambers_of_Xeric/Strategies", category: "Raids" },
  { name: "Chambers of Xeric: Challenge Mode", wikiPage: "Chambers_of_Xeric:_Challenge_Mode/Strategies", category: "Raids" },
  { name: "Theatre of Blood", wikiPage: "Theatre_of_Blood/Strategies", category: "Raids" },
  { name: "Theatre of Blood: Hard Mode", wikiPage: "Theatre_of_Blood:_Hard_Mode/Strategies", category: "Raids" },
  { name: "Tombs of Amascut", wikiPage: "Tombs_of_Amascut/Strategies", category: "Raids" },
  { name: "Tombs of Amascut: Expert Mode", wikiPage: "Tombs_of_Amascut:_Expert_Mode/Strategies", category: "Raids" },

  // GWD
  { name: "General Graardor", wikiPage: "General_Graardor/Strategies", category: "GWD", combatLevel: 624, hitpoints: 255 },
  { name: "Kree'arra", wikiPage: "Kree%27arra/Strategies", category: "GWD", combatLevel: 580, hitpoints: 255 },
  { name: "Commander Zilyana", wikiPage: "Commander_Zilyana/Strategies", category: "GWD", combatLevel: 596, hitpoints: 255 },
  { name: "K'ril Tsutsaroth", wikiPage: "K%27ril_Tsutsaroth/Strategies", category: "GWD", combatLevel: 650, hitpoints: 255 },
  { name: "Nex", wikiPage: "Nex/Strategies", category: "GWD", combatLevel: 1001, hitpoints: 3400 },

  // Slayer Bosses
  { name: "Alchemical Hydra", wikiPage: "Alchemical_Hydra/Strategies", category: "Slayer", combatLevel: 426, hitpoints: 1100 },
  { name: "Cerberus", wikiPage: "Cerberus/Strategies", category: "Slayer", combatLevel: 318, hitpoints: 600 },
  { name: "Grotesque Guardians", wikiPage: "Grotesque_Guardians/Strategies", category: "Slayer" },
  { name: "Kraken", wikiPage: "Kraken/Strategies", category: "Slayer", combatLevel: 291, hitpoints: 255 },
  { name: "Thermonuclear Smoke Devil", wikiPage: "Thermonuclear_smoke_devil/Strategies", category: "Slayer", combatLevel: 301, hitpoints: 240 },
  { name: "Abyssal Sire", wikiPage: "Abyssal_Sire/Strategies", category: "Slayer", combatLevel: 350, hitpoints: 400 },

  // Wilderness
  { name: "Vet'ion", wikiPage: "Vet%27ion/Strategies", category: "Wilderness", combatLevel: 454, hitpoints: 255 },
  { name: "Venenatis", wikiPage: "Venenatis/Strategies", category: "Wilderness", combatLevel: 464, hitpoints: 255 },
  { name: "Callisto", wikiPage: "Callisto/Strategies", category: "Wilderness", combatLevel: 470, hitpoints: 255 },
  { name: "Calvar'ion", wikiPage: "Calvar%27ion/Strategies", category: "Wilderness", combatLevel: 352, hitpoints: 255 },
  { name: "Spindel", wikiPage: "Spindel/Strategies", category: "Wilderness", combatLevel: 464, hitpoints: 255 },
  { name: "Artio", wikiPage: "Artio/Strategies", category: "Wilderness", combatLevel: 470, hitpoints: 255 },
  { name: "Chaos Elemental", wikiPage: "Chaos_Elemental/Strategies", category: "Wilderness", combatLevel: 305, hitpoints: 250 },
  { name: "Chaos Fanatic", wikiPage: "Chaos_Fanatic/Strategies", category: "Wilderness", combatLevel: 202, hitpoints: 225 },
  { name: "Crazy Archaeologist", wikiPage: "Crazy_Archaeologist/Strategies", category: "Wilderness", combatLevel: 204, hitpoints: 225 },
  { name: "Scorpia", wikiPage: "Scorpia/Strategies", category: "Wilderness", combatLevel: 225, hitpoints: 200 },

  // Other
  { name: "Vorkath", wikiPage: "Vorkath/Strategies", category: "Other", combatLevel: 732, hitpoints: 750 },
  { name: "Zulrah", wikiPage: "Zulrah/Strategies", category: "Other", combatLevel: 725, hitpoints: 500 },
  { name: "Corporeal Beast", wikiPage: "Corporeal_Beast/Strategies", category: "Other", combatLevel: 785, hitpoints: 2000 },
  { name: "Nightmare", wikiPage: "The_Nightmare/Strategies", category: "Other" },
  { name: "Phosani's Nightmare", wikiPage: "Phosani%27s_Nightmare/Strategies", category: "Other", combatLevel: 375, hitpoints: 2400 },
  { name: "Phantom Muspah", wikiPage: "Phantom_Muspah/Strategies", category: "Other" },
  { name: "Duke Sucellus", wikiPage: "Duke_Sucellus/Strategies", category: "Other" },
  { name: "The Leviathan", wikiPage: "The_Leviathan/Strategies", category: "Other" },
  { name: "Vardorvis", wikiPage: "Vardorvis/Strategies", category: "Other" },
  { name: "The Whisperer", wikiPage: "The_Whisperer/Strategies", category: "Other" },
  { name: "Araxxor", wikiPage: "Araxxor/Strategies", category: "Other" },
  { name: "Scurrius", wikiPage: "Scurrius/Strategies", category: "Other", combatLevel: 230, hitpoints: 400 },
  { name: "Dagannoth Rex", wikiPage: "Dagannoth_Rex/Strategies", category: "Other", combatLevel: 303, hitpoints: 255 },
  { name: "Dagannoth Prime", wikiPage: "Dagannoth_Prime/Strategies", category: "Other", combatLevel: 303, hitpoints: 255 },
  { name: "Dagannoth Supreme", wikiPage: "Dagannoth_Supreme/Strategies", category: "Other", combatLevel: 303, hitpoints: 255 },
  { name: "Blood Moon", wikiPage: "Blood_Moon/Strategies", category: "Other", combatLevel: 560, hitpoints: 400 },
  { name: "Blue Moon", wikiPage: "Blue_Moon_(boss)/Strategies", category: "Other", combatLevel: 560, hitpoints: 400 },
  { name: "Eclipse Moon", wikiPage: "Eclipse_Moon/Strategies", category: "Other", combatLevel: 560, hitpoints: 400 },
  { name: "Giant Mole", wikiPage: "Giant_Mole/Strategies", category: "Other", combatLevel: 230, hitpoints: 200 },
  { name: "King Black Dragon", wikiPage: "King_Black_Dragon/Strategies", category: "Other", combatLevel: 276, hitpoints: 255 },
  { name: "Obor", wikiPage: "Obor/Strategies", category: "Other", combatLevel: 106, hitpoints: 120 },
  { name: "Bryophyta", wikiPage: "Bryophyta/Strategies", category: "Other", combatLevel: 128, hitpoints: 115 },
  { name: "Barrows Chests", wikiPage: "Barrows/Strategies", category: "Other" },
  { name: "Kalphite Queen", wikiPage: "Kalphite_Queen/Strategies", category: "Other", combatLevel: 333, hitpoints: 255 },
  { name: "Skotizo", wikiPage: "Skotizo/Strategies", category: "Other", combatLevel: 321, hitpoints: 450 },
  { name: "Hespori", wikiPage: "Hespori/Strategies", category: "Other", combatLevel: 284, hitpoints: 600 },
  { name: "Deranged Archaeologist", wikiPage: "Deranged_Archaeologist/Strategies", category: "Other", combatLevel: 276, hitpoints: 600 },
  { name: "Sarachnis", wikiPage: "Sarachnis/Strategies", category: "Other", combatLevel: 318, hitpoints: 400 },
  { name: "Wintertodt", wikiPage: "Wintertodt/Strategies", category: "Other" },
  { name: "Tempoross", wikiPage: "Tempoross/Strategies", category: "Other" },
  { name: "Zalcano", wikiPage: "Zalcano/Strategies", category: "Other" },
  { name: "The Gauntlet", wikiPage: "The_Gauntlet/Strategies", category: "Other" },
  { name: "The Corrupted Gauntlet", wikiPage: "Corrupted_Gauntlet/Strategies", category: "Other" },
  { name: "The Mimic", wikiPage: "The_Mimic/Strategies", category: "Other" },
  { name: "TzTok-Jad", wikiPage: "TzTok-Jad/Strategies", category: "Other", combatLevel: 702, hitpoints: 250 },
  { name: "TzKal-Zuk", wikiPage: "TzKal-Zuk/Strategies", category: "Other", combatLevel: 1400, hitpoints: 1200 },

  // Varlamore
  { name: "Amoxliatl", wikiPage: "Amoxliatl/Strategies", category: "Varlamore" },
  { name: "Hueycoatl", wikiPage: "Hueycoatl/Strategies", category: "Varlamore" },
  { name: "Sol Heredit", wikiPage: "Sol_Heredit/Strategies", category: "Varlamore" },
];

export const BOSS_CATEGORIES = [...new Set(BOSSES.map((b) => b.category))];

export function normalizeBossLookup(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/%27/g, "'")
    .replace(/^the\s+/, "")
    .replace(/['']/g, "")
    .replace(/_/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findBossByName(name: string) {
  const normalized = normalizeBossLookup(name);
  return BOSSES.find(
    (boss) =>
      normalizeBossLookup(boss.name) === normalized ||
      normalizeBossLookup(
        decodeURIComponent(boss.wikiPage.split("/")[0]).replace(/_/g, " ")
      ) === normalized
  );
}
