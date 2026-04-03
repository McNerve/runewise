export interface BossInfo {
  name: string;
  wikiPage: string;
  category: string;
  combatLevel?: number;
  hitpoints?: number;
  maxHit?: number;
  weakness?: string;
  hiscoresName?: string;
  location?: string;
}

export const BOSSES: BossInfo[] = [
  // Raids
  { name: "Chambers of Xeric", wikiPage: "Chambers_of_Xeric", category: "Raids", location: "Mount Quidamortem" },
  { name: "Chambers of Xeric: Challenge Mode", wikiPage: "Chambers_of_Xeric", category: "Raids", location: "Mount Quidamortem" },
  { name: "Theatre of Blood", wikiPage: "Theatre_of_Blood", category: "Raids", location: "Ver Sinhaza" },
  { name: "Theatre of Blood: Hard Mode", wikiPage: "Theatre_of_Blood", category: "Raids", location: "Ver Sinhaza" },
  { name: "Tombs of Amascut", wikiPage: "Tombs_of_Amascut", category: "Raids", location: "Necropolis" },
  { name: "Tombs of Amascut: Expert Mode", wikiPage: "Tombs_of_Amascut", category: "Raids", location: "Necropolis" },

  // GWD
  { name: "General Graardor", wikiPage: "General_Graardor", category: "GWD", combatLevel: 624, hitpoints: 255, location: "God Wars Dungeon" },
  { name: "Kree'arra", wikiPage: "Kree%27arra", category: "GWD", combatLevel: 580, hitpoints: 255, location: "God Wars Dungeon" },
  { name: "Commander Zilyana", wikiPage: "Commander_Zilyana", category: "GWD", combatLevel: 596, hitpoints: 255, location: "God Wars Dungeon" },
  { name: "K'ril Tsutsaroth", wikiPage: "K%27ril_Tsutsaroth", category: "GWD", combatLevel: 650, hitpoints: 255, location: "God Wars Dungeon" },
  { name: "Nex", wikiPage: "Nex", category: "GWD", combatLevel: 1001, hitpoints: 3400, location: "Ancient Prison" },

  // Slayer Bosses
  { name: "Alchemical Hydra", wikiPage: "Alchemical_Hydra", category: "Slayer", combatLevel: 426, hitpoints: 1100, location: "Karuulm Slayer Dungeon" },
  { name: "Cerberus", wikiPage: "Cerberus", category: "Slayer", combatLevel: 318, hitpoints: 600, location: "Taverley Dungeon" },
  { name: "Grotesque Guardians", wikiPage: "Grotesque_Guardians", category: "Slayer", combatLevel: 328, hitpoints: 450, location: "Slayer Tower" },
  { name: "Kraken", wikiPage: "Kraken", category: "Slayer", combatLevel: 291, hitpoints: 255, location: "Kraken Cove" },
  { name: "Thermonuclear Smoke Devil", wikiPage: "Thermonuclear_smoke_devil", category: "Slayer", combatLevel: 301, hitpoints: 240, location: "Smoke Devil Dungeon" },
  { name: "Abyssal Sire", wikiPage: "Abyssal_Sire", category: "Slayer", combatLevel: 350, hitpoints: 400, location: "Abyssal Nexus" },

  // Wilderness
  { name: "Vet'ion", wikiPage: "Vet%27ion", category: "Wilderness", combatLevel: 454, hitpoints: 255, location: "Wilderness (Lv 31)" },
  { name: "Venenatis", wikiPage: "Venenatis", category: "Wilderness", combatLevel: 464, hitpoints: 255, location: "Wilderness (Lv 28)" },
  { name: "Callisto", wikiPage: "Callisto", category: "Wilderness", combatLevel: 470, hitpoints: 255, location: "Wilderness (Lv 41)" },
  { name: "Calvar'ion", wikiPage: "Calvar%27ion", category: "Wilderness", combatLevel: 352, hitpoints: 255, location: "Wilderness (Lv 29)" },
  { name: "Spindel", wikiPage: "Spindel", category: "Wilderness", combatLevel: 464, hitpoints: 255, location: "Web Chasm" },
  { name: "Artio", wikiPage: "Artio", category: "Wilderness", combatLevel: 470, hitpoints: 255, location: "Wilderness (Lv 21)" },
  { name: "Chaos Elemental", wikiPage: "Chaos_Elemental", category: "Wilderness", combatLevel: 305, hitpoints: 250, location: "Wilderness (Lv 50)" },
  { name: "Chaos Fanatic", wikiPage: "Chaos_Fanatic", category: "Wilderness", combatLevel: 202, hitpoints: 225, location: "Wilderness (Lv 42)" },
  { name: "Crazy Archaeologist", wikiPage: "Crazy_Archaeologist", category: "Wilderness", combatLevel: 204, hitpoints: 225, location: "Wilderness (Lv 23)" },
  { name: "Scorpia", wikiPage: "Scorpia", category: "Wilderness", combatLevel: 225, hitpoints: 200, location: "Scorpia's Lair" },

  // Other
  { name: "Vorkath", wikiPage: "Vorkath", category: "Other", combatLevel: 732, hitpoints: 750, location: "Ungael" },
  { name: "Zulrah", wikiPage: "Zulrah", category: "Other", combatLevel: 725, hitpoints: 500, location: "Zul-Andra" },
  { name: "Corporeal Beast", wikiPage: "Corporeal_Beast", category: "Other", combatLevel: 785, hitpoints: 2000, location: "Corporeal Beast's Lair" },
  { name: "Nightmare", wikiPage: "The_Nightmare", category: "Other", hiscoresName: "The Nightmare", combatLevel: 814, hitpoints: 2400, location: "Sisterhood Sanctuary" },
  { name: "Phosani's Nightmare", wikiPage: "Phosani%27s_Nightmare", category: "Other", combatLevel: 814, hitpoints: 2400, location: "Sisterhood Sanctuary" },
  { name: "Phantom Muspah", wikiPage: "Phantom_Muspah", category: "Other", combatLevel: 608, hitpoints: 750, location: "Ghorrock Prison" },
  { name: "Duke Sucellus", wikiPage: "Duke_Sucellus", category: "Other", combatLevel: 548, hitpoints: 640, location: "Ancient Vault" },
  { name: "The Leviathan", wikiPage: "The_Leviathan", category: "Other", combatLevel: 702, hitpoints: 750, location: "Scar Temple" },
  { name: "Vardorvis", wikiPage: "Vardorvis", category: "Other", combatLevel: 572, hitpoints: 640, location: "Stranglewood" },
  { name: "The Whisperer", wikiPage: "The_Whisperer", category: "Other", combatLevel: 568, hitpoints: 680, location: "Lassar Undercity" },
  { name: "Araxxor", wikiPage: "Araxxor", category: "Slayer", combatLevel: 450, hitpoints: 800, location: "Araxyte Cave" },
  { name: "Scurrius", wikiPage: "Scurrius", category: "Other", combatLevel: 230, hitpoints: 400, location: "Varrock Sewers" },
  { name: "Dagannoth Rex", wikiPage: "Dagannoth_Rex", category: "Other", combatLevel: 303, hitpoints: 255, location: "Waterbirth Island Dungeon" },
  { name: "Dagannoth Prime", wikiPage: "Dagannoth_Prime", category: "Other", combatLevel: 303, hitpoints: 255, location: "Waterbirth Island Dungeon" },
  { name: "Dagannoth Supreme", wikiPage: "Dagannoth_Supreme", category: "Other", combatLevel: 303, hitpoints: 255, location: "Waterbirth Island Dungeon" },
  { name: "Blood Moon", wikiPage: "Blood_Moon", category: "Other", combatLevel: 560, hitpoints: 400, location: "Perilous Moons" },
  { name: "Blue Moon", wikiPage: "Blue_Moon", category: "Other", combatLevel: 560, hitpoints: 400, location: "Perilous Moons" },
  { name: "Eclipse Moon", wikiPage: "Eclipse_Moon", category: "Other", combatLevel: 560, hitpoints: 400, location: "Perilous Moons" },
  { name: "Giant Mole", wikiPage: "Giant_Mole", category: "Other", combatLevel: 230, hitpoints: 200, location: "Falador Mole Lair" },
  { name: "King Black Dragon", wikiPage: "King_Black_Dragon", category: "Other", combatLevel: 276, hitpoints: 255, location: "King Black Dragon Lair" },
  { name: "Obor", wikiPage: "Obor", category: "Other", combatLevel: 106, hitpoints: 120, location: "Edgeville Dungeon" },
  { name: "Bryophyta", wikiPage: "Bryophyta", category: "Other", combatLevel: 128, hitpoints: 115, location: "Varrock Sewers" },
  { name: "Barrows Chests", wikiPage: "Barrows", category: "Other", location: "Barrows" },
  { name: "Kalphite Queen", wikiPage: "Kalphite_Queen", category: "Other", combatLevel: 333, hitpoints: 255, location: "Kalphite Lair" },
  { name: "Skotizo", wikiPage: "Skotizo", category: "Other", combatLevel: 321, hitpoints: 450, location: "Catacombs of Kourend" },
  { name: "Hespori", wikiPage: "Hespori", category: "Other", combatLevel: 284, hitpoints: 600, location: "Farming Guild" },
  { name: "Deranged Archaeologist", wikiPage: "Deranged_Archaeologist", category: "Other", combatLevel: 276, hitpoints: 600, location: "Fossil Island" },
  { name: "Sarachnis", wikiPage: "Sarachnis", category: "Other", combatLevel: 318, hitpoints: 400, location: "Forthos Dungeon" },
  { name: "Wintertodt", wikiPage: "Wintertodt", category: "Other", location: "Northern Tundras" },
  { name: "Tempoross", wikiPage: "Tempoross", category: "Other", location: "Tempoross Cove" },
  { name: "Zalcano", wikiPage: "Zalcano", category: "Other", location: "Prifddinas" },
  { name: "The Gauntlet", wikiPage: "The_Gauntlet", category: "Other", location: "Prifddinas" },
  { name: "The Corrupted Gauntlet", wikiPage: "Corrupted_Gauntlet", category: "Other", location: "Prifddinas" },
  { name: "The Mimic", wikiPage: "The_Mimic", category: "Other", hiscoresName: "Mimic" },
  { name: "TzTok-Jad", wikiPage: "TzTok-Jad", category: "Other", combatLevel: 702, hitpoints: 250, location: "Fight Caves" },
  { name: "TzKal-Zuk", wikiPage: "TzKal-Zuk", category: "Other", combatLevel: 1400, hitpoints: 1200, location: "The Inferno" },

  // Varlamore
  { name: "Amoxliatl", wikiPage: "Amoxliatl", category: "Varlamore", combatLevel: 285, hitpoints: 520, location: "Varlamore" },
  { name: "Hueycoatl", wikiPage: "Hueycoatl", category: "Varlamore", combatLevel: 400, hitpoints: 750, location: "Varlamore" },
  { name: "Sol Heredit", wikiPage: "Fortis_Colosseum", category: "Varlamore", hiscoresName: "The Fortis Colosseum", location: "Fortis Colosseum" },

  // Hiscores-tracked
  { name: "Lunar Chests", wikiPage: "Moons_of_Peril", category: "Other", location: "Perilous Moons" },
  { name: "Yama", wikiPage: "Yama", category: "Other" },
  { name: "The Royal Titans", wikiPage: "The_Royal_Titans", category: "Other" },
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
