export interface SkillPet {
  name: string;
  skill: string;
  icon: string;
  actions: {
    name: string;
    baseChance: number;
    xpPerAction: number;
    /** Plural unit of the roll: "actions" (default), "kills", "games", "subdues", "runs". */
    unit?: string;
  }[];
}

export interface BossPet {
  name: string;
  source: string;
  icon: string;
  baseRate: number;
  category: "boss" | "raid" | "minigame" | "other";
  /** Plural unit of the roll: "kills", "completions", "caskets", "games", "catches", "rumours". Default: "kills" (boss) or "completions" (raid). */
  unit?: string;
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
  { name: "Ikkle hydra", source: "Alchemical Hydra", icon: "Ikkle_Hydra_%28serpentine%29.png", baseRate: 3000, category: "boss" },
  { name: "Hellpuppy", source: "Cerberus", icon: "Hellpuppy.png", baseRate: 3000, category: "boss" },
  { name: "Noon", source: "Grotesque Guardians", icon: "Noon.png", baseRate: 3000, category: "boss" },
  { name: "Pet kraken", source: "Kraken", icon: "Pet_kraken.png", baseRate: 3000, category: "boss" },
  { name: "Pet smoke devil", source: "Thermonuclear smoke devil", icon: "Pet_smoke_devil.png", baseRate: 3000, category: "boss" },
  // Raids — baseline rates; Phase 3 adds scaling modifiers
  { name: "Olmlet", source: "Chambers of Xeric", icon: "Olmlet.png", baseRate: 53, category: "raid" }, // scales with points (1/53 solo max-points baseline)
  { name: "Lil' zik", source: "Theatre of Blood", icon: "Lil%27_zik.png", baseRate: 650, category: "raid" }, // 1/650 Normal base; 1/500 HM; scales to 1/6,500 on low performance
  { name: "Tumeken's guardian", source: "Tombs of Amascut", icon: "Tumeken%27s_guardian.png", baseRate: 350, category: "raid" }, // scales with invocation + raid level
  // Wilderness (wilderness-lite variants tracked as comments; Phase 3 may split)
  { name: "Vet'ion jr.", source: "Vet'ion", icon: "Vet%27ion_jr..png", baseRate: 1500, category: "boss" }, // wilderness-lite variant: Calvar'ion 1/2,800
  { name: "Callisto cub", source: "Callisto", icon: "Callisto_cub.png", baseRate: 1500, category: "boss" }, // wilderness-lite variant: Artio 1/2,800
  { name: "Venenatis spiderling", source: "Venenatis", icon: "Venenatis_spiderling.png", baseRate: 1500, category: "boss" }, // wilderness-lite variant: Spindel 1/2,800
  { name: "Scorpia's offspring", source: "Scorpia", icon: "Scorpia%27s_offspring.png", baseRate: 2016, category: "boss" },
  { name: "Pet chaos elemental", source: "Chaos Elemental", icon: "Pet_chaos_elemental.png", baseRate: 300, category: "boss" }, // Chaos Fanatic variant: 1/1,000
  // DT2
  { name: "Wisp", source: "The Whisperer", icon: "Wisp.png", baseRate: 2000, category: "boss" },
  { name: "Baron", source: "Duke Sucellus", icon: "Baron.png", baseRate: 2500, category: "boss" },
  { name: "Butch", source: "Vardorvis", icon: "Butch.png", baseRate: 3000, category: "boss" },
  { name: "Lil'viathan", source: "The Leviathan", icon: "Lil%27viathan.png", baseRate: 2500, category: "boss" },
  // Other bosses
  { name: "Prince black dragon", source: "King Black Dragon", icon: "Prince_black_dragon.png", baseRate: 3000, category: "boss" },
  { name: "Kalphite princess", source: "Kalphite Queen", icon: "Kalphite_princess.png", baseRate: 3000, category: "boss" },
  { name: "Pet dagannoth supreme", source: "Dagannoth Supreme", icon: "Pet_dagannoth_supreme.png", baseRate: 5000, category: "boss" },
  { name: "Pet dagannoth prime", source: "Dagannoth Prime", icon: "Pet_dagannoth_prime.png", baseRate: 5000, category: "boss" },
  { name: "Pet dagannoth rex", source: "Dagannoth Rex", icon: "Pet_dagannoth_rex.png", baseRate: 5000, category: "boss" },
  { name: "Pet dark core", source: "Corporeal Beast", icon: "Pet_dark_core.png", baseRate: 5000, category: "boss" },
  { name: "Skotos", source: "Skotizo", icon: "Skotos.png", baseRate: 65, category: "boss" },
  { name: "Jal-nib-rek", source: "TzKal-Zuk (Inferno)", icon: "Jal-nib-rek.png", baseRate: 100, category: "boss" }, // 1/75 on Slayer task
  { name: "Tzrek-jad", source: "TzTok-Jad (Fight Caves)", icon: "TzRek-Jad.png", baseRate: 200, category: "boss" }, // 1/100 on Slayer task
  { name: "Muphin", source: "Phantom Muspah", icon: "Muphin.png", baseRate: 2500, category: "boss" },
  { name: "Little nightmare", source: "The Nightmare", icon: "Little_nightmare.png", baseRate: 4000, category: "boss" }, // scales 1/800 (solo) to 1/4,000 (5+ team); Phosani's 1/1,400
  { name: "Scurry", source: "Scurrius", icon: "Scurry.png", baseRate: 3000, category: "boss" },
  { name: "Nid", source: "Araxxor", icon: "Nid.png", baseRate: 3000, category: "boss" }, // 1/1,500 if Destroy loot option
  { name: "Smol heredit", source: "Sol Heredit (Fortis Colosseum)", icon: "Smol_heredit.png", baseRate: 200, category: "boss" },
  { name: "Abyssal orphan", source: "Abyssal Sire", icon: "Abyssal_orphan.png", baseRate: 2560, category: "boss" },
  { name: "Huberte", source: "The Hueycoatl", icon: "Huberte.png", baseRate: 400, category: "boss" },
  { name: "Moxi", source: "Amoxliatl", icon: "Moxi.png", baseRate: 3000, category: "boss" },
  { name: "Baby mole", source: "Giant Mole", icon: "Baby_mole.png", baseRate: 3000, category: "boss" },
  { name: "Sraracha", source: "Sarachnis", icon: "Sraracha.png", baseRate: 3000, category: "boss" },
  { name: "Bran", source: "Royal Titans", icon: "Bran.png", baseRate: 3000, category: "boss" }, // 1/1,500 if Sacrifice option
  { name: "Beef", source: "Brutus", icon: "Beef.png", baseRate: 1000, category: "boss" }, // 1/400 Demonic Brutus
  { name: "Dom", source: "Doom of Mokhaiotl", icon: "Dom.png", baseRate: 1000, category: "boss" }, // scales by delve: 1/1,000 @ L6, 1/750 @ L7, 1/500 @ L8, 1/250 @ L9+
  { name: "Gull", source: "Shellbane Gryphon", icon: "Gull.png", baseRate: 3000, category: "boss" },
  { name: "Yami", source: "Yama", icon: "Yami.png", baseRate: 2500, category: "boss" }, // 1/100 on Contract of familiar acquisition
  // Minigame / raid-adjacent
  { name: "Tiny tempor", source: "Tempoross", icon: "Tiny_tempor.png", baseRate: 8000, category: "minigame", unit: "games" },
  { name: "Lil' creator", source: "Soul Wars", icon: "Lil%27_creator.png", baseRate: 400, category: "minigame", unit: "games" },
  { name: "Abyssal protector", source: "Guardians of the Rift", icon: "Abyssal_protector.png", baseRate: 4000, category: "minigame", unit: "games" },
  { name: "Youngllef", source: "Corrupted Gauntlet", icon: "Youngllef.png", baseRate: 800, category: "boss", unit: "completions" }, // normal Gauntlet 1/2,000
  // Other pets
  { name: "Bloodhound", source: "Master Clue Casket", icon: "Bloodhound.png", baseRate: 1000, category: "other", unit: "caskets" },
  { name: "Herbi", source: "Herbiboar", icon: "Herbi.png", baseRate: 6500, category: "other", unit: "catches" },
  { name: "Chompy chick", source: "Chompy birds (Elite Western Diary)", icon: "Chompy_chick.png", baseRate: 500, category: "other" },
  { name: "Pet penance queen", source: "Barbarian Assault", icon: "Pet_penance_queen.png", baseRate: 1000, category: "minigame", unit: "waves" },
];

export const SKILL_PETS: SkillPet[] = [
  {
    name: "Rock golem", skill: "Mining", icon: "Rock_golem.png",
    actions: [
      { name: "Iron ore", baseChance: 741_600, xpPerAction: 35 },
      { name: "Amethyst", baseChance: 46_350, xpPerAction: 240 },
      { name: "Gem rocks", baseChance: 211_886, xpPerAction: 65 },
      { name: "Motherlode Mine (pay-dirt)", baseChance: 247_200, xpPerAction: 60 },
      { name: "Volcanic Mine", baseChance: 60_000, xpPerAction: 95 },
      { name: "Crashed Star", baseChance: 521_550, xpPerAction: 60 },
      { name: "Runite rocks", baseChance: 42_377, xpPerAction: 125 },
    ],
  },
  {
    name: "Heron", skill: "Fishing", icon: "Heron.png",
    actions: [
      { name: "Sharks", baseChance: 82_243, xpPerAction: 110 },
      { name: "Anglerfish", baseChance: 78_649, xpPerAction: 120 },
      { name: "Leaping fish (Barbarian)", baseChance: 1_280_862, xpPerAction: 80 },
      { name: "Minnow", baseChance: 977_778, xpPerAction: 26.1 },
      { name: "Fishing Trawler", baseChance: 5_000, xpPerAction: 1000 },
    ],
  },
  {
    name: "Beaver", skill: "Woodcutting", icon: "Beaver.png",
    actions: [
      { name: "Yew trees", baseChance: 145_013, xpPerAction: 175 },
      { name: "Magic trees", baseChance: 72_321, xpPerAction: 250 },
      { name: "Redwood trees", baseChance: 72_321, xpPerAction: 380 },
      { name: "Teak trees", baseChance: 264_336, xpPerAction: 85 },
    ],
  },
  {
    name: "Baby chinchompa", skill: "Hunter", icon: "Baby_chinchompa.png",
    actions: [
      { name: "Grey chinchompas", baseChance: 131_395, xpPerAction: 198 },
      { name: "Red chinchompas", baseChance: 98_373, xpPerAction: 265 },
      { name: "Black chinchompas", baseChance: 82_758, xpPerAction: 315 },
    ],
  },
  {
    // Quetzin: flat 1/1000 per Expert/Master rumour. 200M Hunter triggers 15x bonus.
    name: "Quetzin", skill: "Hunter", icon: "Quetzin.png",
    actions: [
      { name: "Expert/Master rumours", baseChance: 1_000, xpPerAction: 0 },
    ],
  },
  {
    name: "Giant squirrel", skill: "Agility", icon: "Giant_squirrel.png",
    actions: [
      { name: "Canifis Rooftop", baseChance: 36_842, xpPerAction: 240 },
      { name: "Seers' Village Rooftop", baseChance: 35_205, xpPerAction: 570 },
      { name: "Ardougne Rooftop", baseChance: 34_440, xpPerAction: 793 },
      { name: "Hallowed Sepulchre (floor 5)", baseChance: 2_000, xpPerAction: 17700 },
    ],
  },
  {
    name: "Tangleroot", skill: "Farming", icon: "Tangleroot.png",
    actions: [
      // Aggregate rate per full mixed run — approximates trees + fruit trees + herbs + allotments.
      // xpPerAction ~60k assumes a typical run. baseChance 3325 = L99 effective 1/850 after -25L scaling.
      { name: "Farm run (mixed)", baseChance: 3_325, xpPerAction: 60_000, unit: "runs" },
      { name: "Hespori", baseChance: 65, xpPerAction: 0, unit: "kills" },
    ],
  },
  {
    name: "Rocky", skill: "Thieving", icon: "Rocky.png",
    actions: [
      { name: "Knights of Ardougne", baseChance: 257_211, xpPerAction: 132.5 },
      { name: "Elves", baseChance: 99_175, xpPerAction: 353 },
      { name: "Blackjacking (Menaphite Thug)", baseChance: 257_211, xpPerAction: 160 },
    ],
  },
  {
    name: "Rift guardian", skill: "Runecraft", icon: "Rift_guardian.png",
    actions: [
      { name: "Blood runes (Arceuus)", baseChance: 804_984, xpPerAction: 23.8 },
      { name: "Soul runes", baseChance: 782_999, xpPerAction: 29.7 },
      { name: "Lava runes", baseChance: 1_795_758, xpPerAction: 10.5 },
      { name: "Ourania Altar", baseChance: 1_487_213, xpPerAction: 66 },
    ],
  },
  {
    name: "Phoenix", skill: "Firemaking", icon: "Phoenix_pet.png",
    actions: [
      { name: "Wintertodt subdue", baseChance: 5_000, xpPerAction: 0, unit: "subdues" },
    ],
  },
  {
    name: "Smolcano", skill: "Mining", icon: "Smolcano.png",
    actions: [
      { name: "Zalcano kill", baseChance: 2_250, xpPerAction: 0, unit: "kills" },
    ],
  },
  {
    name: "Soup", skill: "Sailing", icon: "Soup.png",
    actions: [
      // Soup does not use the 1/(B-25L) formula — rates are flat per activity
      { name: "Port tasks (level 99)", baseChance: 3_150, xpPerAction: 0 },
      { name: "Sea charting", baseChance: 30_000, xpPerAction: 0 },
      { name: "Gwenith Glide Marlin", baseChance: 3_000, xpPerAction: 0 },
      { name: "Trimming sails", baseChance: 120_000, xpPerAction: 0 },
    ],
  },
];
