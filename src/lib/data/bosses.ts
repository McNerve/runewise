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
  { name: "General Graardor", wikiPage: "General_Graardor", category: "GWD", combatLevel: 624, hitpoints: 255, location: "God Wars Dungeon", weakness: "Ranged" },
  { name: "Kree'arra", wikiPage: "Kree%27arra", category: "GWD", combatLevel: 580, hitpoints: 255, location: "God Wars Dungeon", weakness: "Magic" },
  { name: "Commander Zilyana", wikiPage: "Commander_Zilyana", category: "GWD", combatLevel: 596, hitpoints: 255, location: "God Wars Dungeon", weakness: "Ranged" },
  { name: "K'ril Tsutsaroth", wikiPage: "K%27ril_Tsutsaroth", category: "GWD", combatLevel: 650, hitpoints: 255, location: "God Wars Dungeon", weakness: "Melee" },
  { name: "Nex", wikiPage: "Nex", category: "GWD", combatLevel: 1001, hitpoints: 3400, location: "Ancient Prison", weakness: "Ranged" },

  // Slayer Bosses
  { name: "Alchemical Hydra", wikiPage: "Alchemical_Hydra", category: "Slayer", combatLevel: 426, hitpoints: 1100, location: "Karuulm Slayer Dungeon", weakness: "Ranged" },
  { name: "Cerberus", wikiPage: "Cerberus", category: "Slayer", combatLevel: 318, hitpoints: 600, location: "Taverley Dungeon", weakness: "Melee" },
  { name: "Grotesque Guardians", wikiPage: "Grotesque_Guardians", category: "Slayer", combatLevel: 328, hitpoints: 450, location: "Slayer Tower", weakness: "Melee" },
  { name: "Kraken", wikiPage: "Kraken", category: "Slayer", combatLevel: 291, hitpoints: 255, location: "Kraken Cove", weakness: "Magic" },
  { name: "Thermonuclear Smoke Devil", wikiPage: "Thermonuclear_smoke_devil", category: "Slayer", combatLevel: 301, hitpoints: 240, location: "Smoke Devil Dungeon", weakness: "Ranged" },
  { name: "Abyssal Sire", wikiPage: "Abyssal_Sire", category: "Slayer", combatLevel: 350, hitpoints: 400, location: "Abyssal Nexus", weakness: "Ranged" },

  // Wilderness
  { name: "Vet'ion", wikiPage: "Vet%27ion", category: "Wilderness", combatLevel: 454, hitpoints: 255, location: "Wilderness (Lv 31)", weakness: "Magic" },
  { name: "Venenatis", wikiPage: "Venenatis", category: "Wilderness", combatLevel: 464, hitpoints: 255, location: "Wilderness (Lv 28)", weakness: "Ranged" },
  { name: "Callisto", wikiPage: "Callisto", category: "Wilderness", combatLevel: 470, hitpoints: 255, location: "Wilderness (Lv 41)", weakness: "Ranged" },
  { name: "Calvar'ion", wikiPage: "Calvar%27ion", category: "Wilderness", combatLevel: 352, hitpoints: 255, location: "Wilderness (Lv 29)", weakness: "Magic" },
  { name: "Spindel", wikiPage: "Spindel", category: "Wilderness", combatLevel: 464, hitpoints: 255, location: "Web Chasm", weakness: "Ranged" },
  { name: "Artio", wikiPage: "Artio", category: "Wilderness", combatLevel: 470, hitpoints: 255, location: "Wilderness (Lv 21)", weakness: "Ranged" },
  { name: "Chaos Elemental", wikiPage: "Chaos_Elemental", category: "Wilderness", combatLevel: 305, hitpoints: 250, location: "Wilderness (Lv 50)" },
  { name: "Chaos Fanatic", wikiPage: "Chaos_Fanatic", category: "Wilderness", combatLevel: 202, hitpoints: 225, location: "Wilderness (Lv 42)", weakness: "Ranged" },
  { name: "Crazy Archaeologist", wikiPage: "Crazy_Archaeologist", category: "Wilderness", combatLevel: 204, hitpoints: 225, location: "Wilderness (Lv 23)", weakness: "Ranged" },
  { name: "Scorpia", wikiPage: "Scorpia", category: "Wilderness", combatLevel: 225, hitpoints: 200, location: "Scorpia's Lair", weakness: "Magic" },

  // Other
  { name: "Vorkath", wikiPage: "Vorkath", category: "Other", combatLevel: 732, hitpoints: 750, location: "Ungael", weakness: "Ranged" },
  { name: "Zulrah", wikiPage: "Zulrah", category: "Other", combatLevel: 725, hitpoints: 500, location: "Zul-Andra" },
  { name: "Corporeal Beast", wikiPage: "Corporeal_Beast", category: "Other", combatLevel: 785, hitpoints: 2000, location: "Corporeal Beast's Lair", weakness: "Stab" },
  { name: "Nightmare", wikiPage: "The_Nightmare", category: "Other", hiscoresName: "The Nightmare", combatLevel: 814, hitpoints: 2400, location: "Sisterhood Sanctuary", weakness: "Magic" },
  { name: "Phosani's Nightmare", wikiPage: "Phosani%27s_Nightmare", category: "Other", combatLevel: 814, hitpoints: 2400, location: "Sisterhood Sanctuary", weakness: "Magic" },
  { name: "Phantom Muspah", wikiPage: "Phantom_Muspah", category: "Other", combatLevel: 608, hitpoints: 750, location: "Ghorrock Prison", weakness: "Ranged" },
  { name: "Duke Sucellus", wikiPage: "Duke_Sucellus", category: "Other", combatLevel: 548, hitpoints: 640, location: "Ancient Vault", weakness: "Crush" },
  { name: "The Leviathan", wikiPage: "The_Leviathan", category: "Other", combatLevel: 702, hitpoints: 750, location: "Scar Temple", weakness: "Ranged" },
  { name: "Vardorvis", wikiPage: "Vardorvis", category: "Other", combatLevel: 572, hitpoints: 640, location: "Stranglewood", weakness: "Slash" },
  { name: "The Whisperer", wikiPage: "The_Whisperer", category: "Other", combatLevel: 568, hitpoints: 680, location: "Lassar Undercity", weakness: "Magic" },
  { name: "Araxxor", wikiPage: "Araxxor", category: "Slayer", combatLevel: 450, hitpoints: 800, location: "Araxyte Cave", weakness: "Ranged" },
  { name: "Scurrius", wikiPage: "Scurrius", category: "Other", combatLevel: 230, hitpoints: 400, location: "Varrock Sewers", weakness: "Ranged" },
  { name: "Dagannoth Rex", wikiPage: "Dagannoth_Rex", category: "Other", combatLevel: 303, hitpoints: 255, location: "Waterbirth Island Dungeon", weakness: "Magic" },
  { name: "Dagannoth Prime", wikiPage: "Dagannoth_Prime", category: "Other", combatLevel: 303, hitpoints: 255, location: "Waterbirth Island Dungeon", weakness: "Ranged" },
  { name: "Dagannoth Supreme", wikiPage: "Dagannoth_Supreme", category: "Other", combatLevel: 303, hitpoints: 255, location: "Waterbirth Island Dungeon", weakness: "Melee" },
  { name: "Blood Moon", wikiPage: "Blood_Moon", category: "Other", combatLevel: 560, hitpoints: 400, location: "Perilous Moons", weakness: "Slash" },
  { name: "Blue Moon", wikiPage: "Blue_Moon", category: "Other", combatLevel: 560, hitpoints: 400, location: "Perilous Moons", weakness: "Magic" },
  { name: "Eclipse Moon", wikiPage: "Eclipse_Moon", category: "Other", combatLevel: 560, hitpoints: 400, location: "Perilous Moons", weakness: "Ranged" },
  { name: "Giant Mole", wikiPage: "Giant_Mole", category: "Other", combatLevel: 230, hitpoints: 200, location: "Falador Mole Lair", weakness: "Ranged" },
  { name: "King Black Dragon", wikiPage: "King_Black_Dragon", category: "Other", combatLevel: 276, hitpoints: 255, location: "King Black Dragon Lair", weakness: "Ranged" },
  { name: "Obor", wikiPage: "Obor", category: "Other", combatLevel: 106, hitpoints: 120, location: "Edgeville Dungeon", weakness: "Ranged" },
  { name: "Bryophyta", wikiPage: "Bryophyta", category: "Other", combatLevel: 128, hitpoints: 115, location: "Varrock Sewers", weakness: "Melee" },
  { name: "Barrows Chests", wikiPage: "Barrows", category: "Other", location: "Barrows" },
  { name: "Kalphite Queen", wikiPage: "Kalphite_Queen", category: "Other", combatLevel: 333, hitpoints: 255, location: "Kalphite Lair", weakness: "Slash" },
  { name: "Skotizo", wikiPage: "Skotizo", category: "Other", combatLevel: 321, hitpoints: 450, location: "Catacombs of Kourend", weakness: "Melee" },
  { name: "Hespori", wikiPage: "Hespori", category: "Other", combatLevel: 284, hitpoints: 600, location: "Farming Guild", weakness: "Magic" },
  { name: "Deranged Archaeologist", wikiPage: "Deranged_Archaeologist", category: "Other", combatLevel: 276, hitpoints: 600, location: "Fossil Island", weakness: "Ranged" },
  { name: "Sarachnis", wikiPage: "Sarachnis", category: "Other", combatLevel: 318, hitpoints: 400, location: "Forthos Dungeon", weakness: "Crush" },
  { name: "Wintertodt", wikiPage: "Wintertodt", category: "Other", location: "Northern Tundras" },
  { name: "Tempoross", wikiPage: "Tempoross", category: "Other", location: "Tempoross Cove" },
  { name: "Zalcano", wikiPage: "Zalcano", category: "Other", location: "Prifddinas" },
  { name: "The Gauntlet", wikiPage: "The_Gauntlet", category: "Other", location: "Prifddinas" },
  { name: "The Corrupted Gauntlet", wikiPage: "Corrupted_Gauntlet", category: "Other", location: "Prifddinas" },
  { name: "The Mimic", wikiPage: "The_Mimic", category: "Other", hiscoresName: "Mimic" },
  { name: "TzTok-Jad", wikiPage: "TzTok-Jad", category: "Other", combatLevel: 702, hitpoints: 250, location: "Fight Caves" },
  { name: "TzKal-Zuk", wikiPage: "TzKal-Zuk", category: "Other", combatLevel: 1400, hitpoints: 1200, location: "The Inferno" },

  // Varlamore
  { name: "Amoxliatl", wikiPage: "Amoxliatl", category: "Varlamore", combatLevel: 285, hitpoints: 520, location: "Varlamore", weakness: "Ranged" },
  { name: "Hueycoatl", wikiPage: "Hueycoatl", category: "Varlamore", combatLevel: 400, hitpoints: 750, location: "Varlamore", weakness: "Ranged" },
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
