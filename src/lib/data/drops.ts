export interface DropEntry {
  item: string;
  source: string;
  rate: number;
  category: string;
}

export const POPULAR_DROPS: DropEntry[] = [
  // Raids
  { item: "Twisted bow", source: "Chambers of Xeric", rate: 34.5, category: "Raids" },
  { item: "Scythe of vitur", source: "Theatre of Blood", rate: 86, category: "Raids" },
  { item: "Tumeken's shadow", source: "Tombs of Amascut", rate: 24, category: "Raids" },
  { item: "Masori mask", source: "Tombs of Amascut", rate: 24, category: "Raids" },
  { item: "Osmumten's fang", source: "Tombs of Amascut", rate: 8, category: "Raids" },
  { item: "Dragon claws", source: "Chambers of Xeric", rate: 23, category: "Raids" },
  { item: "Dexterous prayer scroll", source: "Chambers of Xeric", rate: 20.3, category: "Raids" },
  { item: "Avernic defender hilt", source: "Theatre of Blood", rate: 86, category: "Raids" },

  // GWD
  { item: "Bandos chestplate", source: "General Graardor", rate: 384, category: "GWD" },
  { item: "Bandos tassets", source: "General Graardor", rate: 384, category: "GWD" },
  { item: "Armadyl chestplate", source: "Kree'arra", rate: 384, category: "GWD" },
  { item: "Armadyl chainskirt", source: "Kree'arra", rate: 384, category: "GWD" },
  { item: "Hilt (any)", source: "Commander Zilyana", rate: 508, category: "GWD" },
  { item: "Godsword shard", source: "GWD Bosses", rate: 256, category: "GWD" },

  // Slayer bosses
  { item: "Hydra's claw", source: "Alchemical Hydra", rate: 1001, category: "Slayer" },
  { item: "Hydra leather", source: "Alchemical Hydra", rate: 514, category: "Slayer" },
  { item: "Abyssal whip", source: "Abyssal demons", rate: 512, category: "Slayer" },
  { item: "Kraken tentacle", source: "Kraken", rate: 400, category: "Slayer" },
  { item: "Cerberus primordial crystal", source: "Cerberus", rate: 512, category: "Slayer" },
  { item: "Grotesque Guardians pet", source: "Grotesque Guardians", rate: 3000, category: "Slayer" },

  // Wilderness
  { item: "Dragon pickaxe", source: "Chaos Elemental", rate: 256, category: "Wilderness" },
  { item: "Voidwaker blade", source: "Vet'ion", rate: 360, category: "Wilderness" },
  { item: "Craw's bow", source: "Revenants", rate: 227, category: "Wilderness" },

  // Other bosses
  { item: "Jar of dirt", source: "Vorkath", rate: 3000, category: "Other" },
  { item: "Vorki", source: "Vorkath", rate: 3000, category: "Other" },
  { item: "Uncut onyx", source: "Zulrah", rate: 512, category: "Other" },
  { item: "Tanzanite fang", source: "Zulrah", rate: 512, category: "Other" },
  { item: "Nex pet", source: "Nex", rate: 500, category: "Other" },
  { item: "Inquisitor's mace", source: "Nightmare", rate: 600, category: "Other" },
  { item: "Sarachnis cudgel", source: "Sarachnis", rate: 384, category: "Other" },

  // Skilling pets
  { item: "Rift guardian", source: "Runecraft", rate: 1795758, category: "Pets" },
  { item: "Rock golem", source: "Mining", rate: 244725, category: "Pets" },
  { item: "Heron", source: "Fishing", rate: 257770, category: "Pets" },
  { item: "Beaver", source: "Woodcutting", rate: 264367, category: "Pets" },
  { item: "Tangleroot", source: "Farming", rate: 7500, category: "Pets" },

  // Clue scrolls
  { item: "3rd age piece (any)", source: "Reward casket (hard)", rate: 211250, category: "Clues" },
  { item: "3rd age piece (any)", source: "Reward casket (elite)", rate: 148750, category: "Clues" },
  { item: "3rd age piece (any)", source: "Reward casket (master)", rate: 313168, category: "Clues" },
  { item: "Ranger boots", source: "Reward casket (medium)", rate: 1133, category: "Clues" },
  { item: "Gilded platebody", source: "Reward casket (hard)", rate: 35750, category: "Clues" },
];

export const DROP_CATEGORIES = [...new Set(POPULAR_DROPS.map((d) => d.category))];
