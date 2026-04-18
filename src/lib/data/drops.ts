export interface DropEntry {
  item: string;
  source: string;
  rate: number;
  category: string;
  note?: string;
}

export const POPULAR_DROPS: DropEntry[] = [
  // Raids
  { item: "Twisted bow", source: "Chambers of Xeric", rate: 34.5, category: "Raids", note: "Rate per unique roll. Scales with points." },
  { item: "Scythe of vitur", source: "Theatre of Blood", rate: 86, category: "Raids", note: "Rate per completion. Scales with team size." },
  { item: "Tumeken's shadow", source: "Tombs of Amascut", rate: 24, category: "Raids", note: "Rate scales with invocation level. Shown at ~150 invocations." },
  { item: "Masori mask", source: "Tombs of Amascut", rate: 24, category: "Raids", note: "Rate scales with invocation level." },
  { item: "Osmumten's fang", source: "Tombs of Amascut", rate: 8, category: "Raids", note: "Rate scales with invocation level." },
  { item: "Dragon claws", source: "Chambers of Xeric", rate: 23, category: "Raids", note: "Rate per unique roll. Scales with points." },
  { item: "Dexterous prayer scroll", source: "Chambers of Xeric", rate: 20.3, category: "Raids", note: "Rate per unique roll. Scales with points." },
  { item: "Avernic defender hilt", source: "Theatre of Blood", rate: 86, category: "Raids", note: "Rate per completion. Scales with team size." },
  { item: "Ancestral hat", source: "Chambers of Xeric", rate: 23, category: "Raids", note: "Rate per unique roll. Scales with points." },
  { item: "Ancestral robe top", source: "Chambers of Xeric", rate: 23, category: "Raids", note: "Rate per unique roll. Scales with points." },
  { item: "Dragon hunter crossbow", source: "Chambers of Xeric", rate: 34.5, category: "Raids", note: "Rate per unique roll. Scales with points." },
  { item: "Masori body (f)", source: "Tombs of Amascut", rate: 24, category: "Raids", note: "Rate scales with invocation level." },
  { item: "Lightbearer", source: "Tombs of Amascut", rate: 8, category: "Raids", note: "Rate scales with invocation level." },
  { item: "Justiciar legguards", source: "Theatre of Blood", rate: 86, category: "Raids", note: "Rate per completion. Scales with team size." },
  { item: "Sanguinesti staff", source: "Theatre of Blood", rate: 86, category: "Raids", note: "Rate per completion. Scales with team size." },
  { item: "Enhanced crystal weapon seed", source: "Corrupted Gauntlet", rate: 400, category: "Raids" },

  // GWD
  { item: "Bandos chestplate", source: "General Graardor", rate: 384, category: "GWD" },
  { item: "Bandos tassets", source: "General Graardor", rate: 384, category: "GWD" },
  { item: "Armadyl chestplate", source: "Kree'arra", rate: 384, category: "GWD" },
  { item: "Armadyl chainskirt", source: "Kree'arra", rate: 384, category: "GWD" },
  { item: "Armadyl hilt", source: "Commander Zilyana", rate: 508, category: "GWD", note: "Rate is for any hilt drop." },
  { item: "Godsword shard 1", source: "GWD Bosses", rate: 256, category: "GWD", note: "Rate is for any shard." },
  { item: "Staff of the dead", source: "K'ril Tsutsaroth", rate: 508, category: "GWD" },
  { item: "Armadyl crossbow", source: "Commander Zilyana", rate: 508, category: "GWD" },
  { item: "Ancient hilt", source: "Nex", rate: 258, category: "GWD" },

  // Slayer
  { item: "Hydra's claw", source: "Alchemical Hydra", rate: 1001, category: "Slayer" },
  { item: "Hydra leather", source: "Alchemical Hydra", rate: 514, category: "Slayer" },
  { item: "Abyssal whip", source: "Abyssal demons", rate: 512, category: "Slayer" },
  { item: "Kraken tentacle", source: "Kraken", rate: 400, category: "Slayer" },
  { item: "Primordial crystal", source: "Cerberus", rate: 512, category: "Slayer" },
  { item: "Eternal gem", source: "Superior slayer creature", rate: 25000, category: "Slayer" },
  { item: "Basilisk jaw", source: "Basilisk Knight", rate: 1000, category: "Slayer" },
  { item: "Drake's claw", source: "Drake", rate: 512, category: "Slayer" },
  { item: "Abyssal dagger", source: "Abyssal Sire", rate: 492, category: "Slayer" },
  { item: "Bludgeon claw", source: "Abyssal Sire", rate: 492, category: "Slayer" },

  // Wilderness
  { item: "Dragon pickaxe", source: "Chaos Elemental", rate: 256, category: "Wilderness" },
  { item: "Voidwaker blade", source: "Vet'ion", rate: 360, category: "Wilderness" },
  { item: "Craw's bow", source: "Revenants", rate: 227, category: "Wilderness" },
  { item: "Ring of the gods", source: "Vet'ion", rate: 512, category: "Wilderness" },
  { item: "Treasonous ring", source: "Venenatis", rate: 512, category: "Wilderness" },
  { item: "Tyrannical ring", source: "Callisto", rate: 512, category: "Wilderness" },

  // Clues
  { item: "3rd age range top", source: "Reward casket (hard)", rate: 211250, category: "Clues", note: "Rate is for any 3rd age piece. Shown rate is per casket." },
  { item: "3rd age range top", source: "Reward casket (elite)", rate: 148750, category: "Clues", note: "Rate is for any 3rd age piece. Shown rate is per casket." },
  { item: "3rd age range top", source: "Reward casket (master)", rate: 313168, category: "Clues", note: "Rate is for any 3rd age piece. Shown rate is per casket." },
  { item: "Ranger boots", source: "Reward casket (medium)", rate: 1133, category: "Clues" },
  { item: "Gilded platebody", source: "Reward casket (hard)", rate: 35750, category: "Clues" },
  { item: "Bloodhound", source: "Reward casket (master)", rate: 1000, category: "Clues" },
  { item: "Holy sandals", source: "Reward casket (medium)", rate: 1133, category: "Clues" },
  { item: "Wizard boots", source: "Reward casket (medium)", rate: 1133, category: "Clues" },

  // Bosses
  { item: "Jar of dirt", source: "Vorkath", rate: 3000, category: "Bosses" },
  { item: "Draconic visage", source: "Vorkath", rate: 5000, category: "Bosses" },
  { item: "Uncut onyx", source: "Zulrah", rate: 512, category: "Bosses" },
  { item: "Tanzanite fang", source: "Zulrah", rate: 512, category: "Bosses" },
  { item: "Inquisitor's mace", source: "Nightmare", rate: 600, category: "Bosses" },
  { item: "Sarachnis cudgel", source: "Sarachnis", rate: 384, category: "Bosses" },
  { item: "Ultor ring", source: "The Whisperer", rate: 1536, category: "Bosses" },
  { item: "Bellator ring", source: "Duke Sucellus", rate: 1536, category: "Bosses" },
  { item: "Magus ring", source: "The Leviathan", rate: 1536, category: "Bosses" },
  { item: "Venator ring", source: "Vardorvis", rate: 1536, category: "Bosses" },
  { item: "Virtus mask", source: "Duke Sucellus", rate: 768, category: "Bosses" },
  { item: "Executioner's axe head", source: "Vardorvis", rate: 768, category: "Bosses" },
  { item: "Siren's staff", source: "The Leviathan", rate: 768, category: "Bosses" },
  { item: "Blue moon spear", source: "The Whisperer", rate: 768, category: "Bosses" },
  { item: "Noxious pommel", source: "Araxxor", rate: 600, category: "Bosses" },
  { item: "Noxious point", source: "Araxxor", rate: 600, category: "Bosses" },
  { item: "Noxious blade", source: "Araxxor", rate: 600, category: "Bosses" },
  { item: "Araxyte fang", source: "Araxxor", rate: 600, category: "Bosses" },
  { item: "Nightmare staff", source: "The Nightmare", rate: 400, category: "Bosses" },
  { item: "Inquisitor's great helm", source: "The Nightmare", rate: 600, category: "Bosses" },
  { item: "Inquisitor's hauberk", source: "The Nightmare", rate: 600, category: "Bosses" },
  { item: "Inquisitor's plateskirt", source: "The Nightmare", rate: 600, category: "Bosses" },
  { item: "Guthan's helm", source: "Barrows", rate: 353, category: "Bosses", note: "Rate is for any Barrows piece." },
  { item: "Tonalztics of ralos", source: "Sol Heredit", rate: 80, category: "Bosses" },
  { item: "Sunfire fanatic helm", source: "Amoxliatl", rate: 256, category: "Bosses" },
  { item: "Hueycoatl hide", source: "Hueycoatl", rate: 150, category: "Bosses" },
  { item: "Blood moon helm", source: "Blood Moon", rate: 256, category: "Bosses" },
  { item: "Blue moon helm", source: "Blue Moon", rate: 256, category: "Bosses" },
  { item: "Eclipse atlatl", source: "Eclipse Moon", rate: 256, category: "Bosses" },
  { item: "Elysian sigil", source: "Corporeal Beast", rate: 4095, category: "Bosses", note: "Solo rate. Effective rate scales with team size." },
  { item: "Spectral sigil", source: "Corporeal Beast", rate: 1365, category: "Bosses" },
  { item: "Arcane sigil", source: "Corporeal Beast", rate: 1365, category: "Bosses" },
  { item: "Jar of darkness", source: "Skotizo", rate: 200, category: "Bosses" },
  { item: "Ancient icon", source: "Phantom Muspah", rate: 75, category: "Bosses" },
  { item: "Titan's sigil", source: "Royal Titans", rate: 300, category: "Bosses" },
  { item: "Sulphur blades", source: "Yama", rate: 400, category: "Bosses" },
  { item: "Scorching bow", source: "Yama", rate: 400, category: "Bosses" },
];

export const DROP_CATEGORIES = [...new Set(POPULAR_DROPS.map((d) => d.category))];
