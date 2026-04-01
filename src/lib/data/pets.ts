export interface SkillPet {
  name: string;
  skill: string;
  icon: string;
  actions: { name: string; baseRate: number; xpPerAction: number }[];
}

export interface BossPet {
  name: string;
  source: string;
  icon: string;
  baseRate: number;
  category: "boss" | "raid" | "minigame" | "other";
}

export const BOSS_PETS: BossPet[] = [
  // GWD
  { name: "Pet general graardor", source: "General Graardor", icon: "Pet_general_graardor.png", baseRate: 5000, category: "boss" },
  { name: "Pet zilyana", source: "Commander Zilyana", icon: "Pet_zilyana.png", baseRate: 5000, category: "boss" },
  { name: "Pet kree'arra", source: "Kree'arra", icon: "Pet_kree%27arra.png", baseRate: 5000, category: "boss" },
  { name: "Pet k'ril tsutsaroth", source: "K'ril Tsutsaroth", icon: "Pet_k%27ril_tsutsaroth.png", baseRate: 5000, category: "boss" },
  { name: "Nexling", source: "Nex", icon: "Nexling.png", baseRate: 500, category: "boss" },
  // Slayer bosses
  { name: "Pet snakeling", source: "Zulrah", icon: "Pet_snakeling.png", baseRate: 4000, category: "boss" },
  { name: "Vorki", source: "Vorkath", icon: "Vorki.png", baseRate: 3000, category: "boss" },
  { name: "Ikkle Hydra", source: "Alchemical Hydra", icon: "Ikkle_Hydra.png", baseRate: 3000, category: "boss" },
  { name: "Hellpuppy", source: "Cerberus", icon: "Hellpuppy.png", baseRate: 3000, category: "boss" },
  { name: "Noon", source: "Grotesque Guardians", icon: "Noon.png", baseRate: 3000, category: "boss" },
  { name: "Pet kraken", source: "Kraken", icon: "Pet_kraken.png", baseRate: 3000, category: "boss" },
  { name: "Pet smoke devil", source: "Thermonuclear Smoke Devil", icon: "Pet_smoke_devil.png", baseRate: 3000, category: "boss" },
  // Raids
  { name: "Olmlet", source: "Chambers of Xeric", icon: "Olmlet.png", baseRate: 53, category: "raid" },
  { name: "Lil' Zik", source: "Theatre of Blood", icon: "Lil%27_Zik.png", baseRate: 650, category: "raid" },
  { name: "Tumeken's Guardian", source: "Tombs of Amascut", icon: "Tumeken%27s_guardian.png", baseRate: 350, category: "raid" },
  // Wilderness
  { name: "Vet'ion jr.", source: "Vet'ion", icon: "Vet%27ion_jr..png", baseRate: 2000, category: "boss" },
  { name: "Callisto cub", source: "Callisto", icon: "Callisto_cub.png", baseRate: 2000, category: "boss" },
  { name: "Venenatis spiderling", source: "Venenatis", icon: "Venenatis_spiderling.png", baseRate: 2000, category: "boss" },
  { name: "Scorpia's offspring", source: "Scorpia", icon: "Scorpia%27s_offspring.png", baseRate: 2000, category: "boss" },
  { name: "Chaos Elemental Jr.", source: "Chaos Elemental", icon: "Chaos_Elemental_Jr..png", baseRate: 300, category: "boss" },
  // DT2
  { name: "Wisp", source: "The Whisperer", icon: "Wisp.png", baseRate: 2500, category: "boss" },
  { name: "Butch", source: "Duke Sucellus", icon: "Butch.png", baseRate: 2500, category: "boss" },
  { name: "Baron", source: "Vardorvis", icon: "Baron.png", baseRate: 2500, category: "boss" },
  { name: "Lil'viathan", source: "The Leviathan", icon: "Lil%27viathan.png", baseRate: 2500, category: "boss" },
  // Other bosses
  { name: "Prince black dragon", source: "King Black Dragon", icon: "Prince_black_dragon.png", baseRate: 3000, category: "boss" },
  { name: "Kalphite princess", source: "Kalphite Queen", icon: "Kalphite_princess.png", baseRate: 3000, category: "boss" },
  { name: "Pet dagannoth supreme", source: "Dagannoth Supreme", icon: "Pet_dagannoth_supreme.png", baseRate: 5000, category: "boss" },
  { name: "Pet dagannoth prime", source: "Dagannoth Prime", icon: "Pet_dagannoth_prime.png", baseRate: 5000, category: "boss" },
  { name: "Pet dagannoth rex", source: "Dagannoth Rex", icon: "Pet_dagannoth_rex.png", baseRate: 5000, category: "boss" },
  { name: "Corporeal critter", source: "Corporeal Beast", icon: "Corporeal_critter.png", baseRate: 5000, category: "boss" },
  { name: "Skotos", source: "Skotizo", icon: "Skotos.png", baseRate: 65, category: "boss" },
  { name: "Jal-nib-rek", source: "TzKal-Zuk (Inferno)", icon: "Jal-nib-rek.png", baseRate: 100, category: "boss" },
  { name: "TzRek-Jad", source: "TzTok-Jad (Fight Caves)", icon: "TzRek-Jad.png", baseRate: 200, category: "boss" },
  { name: "Midnight", source: "Phantom Muspah", icon: "Midnight.png", baseRate: 2560, category: "boss" },
  { name: "Muphin", source: "Phantom Muspah", icon: "Muphin.png", baseRate: 2560, category: "boss" },
  { name: "Little nightmare", source: "The Nightmare", icon: "Little_nightmare.png", baseRate: 4000, category: "boss" },
  { name: "Parasitic egg", source: "The Nightmare (Phosani)", icon: "Parasitic_egg.png", baseRate: 1400, category: "boss" },
  { name: "Scurry", source: "Scurrius", icon: "Scurry.png", baseRate: 3000, category: "boss" },
  { name: "Nid", source: "Araxxor", icon: "Nid.png", baseRate: 3000, category: "boss" },
  { name: "Smol heredit", source: "Fortis Colosseum", icon: "Smol_heredit.png", baseRate: 200, category: "minigame" },
  { name: "Lil' creator", source: "Soul Wars (Spoils of war)", icon: "Lil%27_creator.png", baseRate: 400, category: "minigame" },
  { name: "Tiny tempor", source: "Tempoross", icon: "Tiny_tempor.png", baseRate: 8000, category: "minigame" },
  // Other pets
  { name: "Bloodhound", source: "Master Clue Casket", icon: "Bloodhound.png", baseRate: 1000, category: "other" },
  { name: "Herbi", source: "Herbiboar", icon: "Herbi.png", baseRate: 6500, category: "other" },
  { name: "Youngllef", source: "Gauntlet (Corrupted)", icon: "Youngllef.png", baseRate: 800, category: "boss" },
  { name: "Giant Mole Jr.", source: "Giant Mole", icon: "Baby_mole.png", baseRate: 3000, category: "boss" },
  { name: "Sarachnis Jr.", source: "Sarachnis", icon: "Sraracha.png", baseRate: 3000, category: "boss" },
  { name: "Abyssal orphan", source: "Abyssal Sire", icon: "Abyssal_orphan.png", baseRate: 2560, category: "boss" },
  { name: "Moons pet (Jal-MejJak)", source: "Moons of Peril", icon: "Jal-MejJak.png", baseRate: 500, category: "boss" },
  { name: "Huberte", source: "Hueycoatl", icon: "Huberte.png", baseRate: 3000, category: "boss" },
  { name: "Lil' Amoxliatl", source: "Amoxliatl", icon: "Lil%27_Amoxliatl.png", baseRate: 2500, category: "boss" },
];

export const SKILL_PETS: SkillPet[] = [
  {
    name: "Rock Golem", skill: "Mining", icon: "Rock_golem.png",
    actions: [
      { name: "Iron ore", baseRate: 741_600, xpPerAction: 35 },
      { name: "Amethyst", baseRate: 46_350, xpPerAction: 240 },
      { name: "Gem rocks", baseRate: 211_886, xpPerAction: 65 },
      { name: "Motherlode Mine (pay-dirt)", baseRate: 247_200, xpPerAction: 60 },
      { name: "Volcanic Mine", baseRate: 123_600, xpPerAction: 95 },
      { name: "Shooting Stars", baseRate: 74_160, xpPerAction: 60 },
    ],
  },
  {
    name: "Heron", skill: "Fishing", icon: "Heron.png",
    actions: [
      { name: "Shark", baseRate: 82_243, xpPerAction: 110 },
      { name: "Anglerfish", baseRate: 78_649, xpPerAction: 120 },
      { name: "Barbarian fishing", baseRate: 426_954, xpPerAction: 70 },
      { name: "Minnows", baseRate: 977_778, xpPerAction: 26.1 },
      { name: "Tempoross", baseRate: 168_000, xpPerAction: 65 },
    ],
  },
  {
    name: "Beaver", skill: "Woodcutting", icon: "Beaver.png",
    actions: [
      { name: "Yew trees", baseRate: 72_321, xpPerAction: 175 },
      { name: "Magic trees", baseRate: 72_321, xpPerAction: 250 },
      { name: "Redwood trees", baseRate: 72_321, xpPerAction: 380 },
      { name: "Teak trees", baseRate: 108_482, xpPerAction: 85 },
    ],
  },
  {
    name: "Baby Chinchompa", skill: "Hunter", icon: "Baby_chinchompa.png",
    actions: [
      { name: "Red chinchompas", baseRate: 131_395, xpPerAction: 265 },
      { name: "Black chinchompas", baseRate: 131_395, xpPerAction: 315 },
      { name: "Herbiboar", baseRate: 6_570, xpPerAction: 1950 },
    ],
  },
  {
    name: "Giant Squirrel", skill: "Agility", icon: "Giant_squirrel.png",
    actions: [
      { name: "Canifis course", baseRate: 36_842, xpPerAction: 240 },
      { name: "Seers' Village", baseRate: 35_205, xpPerAction: 570 },
      { name: "Ardougne course", baseRate: 34_440, xpPerAction: 793 },
      { name: "Hallowed Sepulchre (floor 5)", baseRate: 1_000, xpPerAction: 1200 },
    ],
  },
  {
    name: "Tangleroot", skill: "Farming", icon: "Tangleroot.png",
    actions: [
      { name: "Magic tree", baseRate: 9_368, xpPerAction: 13768 },
      { name: "Palm tree", baseRate: 9_000, xpPerAction: 10150 },
      { name: "Herb patch", baseRate: 98_364, xpPerAction: 27 },
      { name: "Hespori", baseRate: 65, xpPerAction: 12600 },
    ],
  },
  {
    name: "Rocky", skill: "Thieving", icon: "Rocky.png",
    actions: [
      { name: "Knights of Ardougne", baseRate: 257_211, xpPerAction: 132.5 },
      { name: "Elves", baseRate: 99_175, xpPerAction: 353 },
      { name: "Blackjacking", baseRate: 257_211, xpPerAction: 160 },
    ],
  },
  {
    name: "Rift Guardian", skill: "Runecraft", icon: "Rift_guardian.png",
    actions: [
      { name: "Blood runes", baseRate: 1_487_213, xpPerAction: 24 },
      { name: "Lava runes", baseRate: 1_487_213, xpPerAction: 26 },
      { name: "GOTR (per reward)", baseRate: 2_227, xpPerAction: 55 },
    ],
  },
  {
    name: "Phoenix", skill: "Firemaking", icon: "Phoenix_pet.png",
    actions: [
      { name: "Wintertodt (500+ points)", baseRate: 5_000, xpPerAction: 100 },
      { name: "Redwood logs", baseRate: 5_000_000, xpPerAction: 350 },
    ],
  },
  {
    name: "Smolcano", skill: "Mining", icon: "Smolcano.png",
    actions: [
      { name: "Zalcano kill", baseRate: 2_250, xpPerAction: 0 },
    ],
  },
];
