export type MarkerCategory =
  | "boss"
  | "city"
  | "fairy-ring"
  | "spirit-tree"
  | "teleport"
  | "slayer"
  | "skilling"
  | "minigame"
  | "quest"
  | "shortcut"
  | "boat";

export interface MapMarker {
  name: string;
  category: MarkerCategory;
  x: number;
  y: number;
  description?: string;
  wikiPage?: string;
}

// OSRS game coordinates — the map uses a coordinate system where
// each tile is 1 unit. The map tiles use x/y at different zoom scales.
// Game coords: x increases East, y increases North
// Tile coords at zoom 2: tile = floor(gameCoord / 64) approximately

export const MAP_MARKERS: MapMarker[] = [
  // Major Cities
  { name: "Lumbridge", category: "city", x: 3222, y: 3218, description: "Starting city", wikiPage: "Lumbridge" },
  { name: "Varrock", category: "city", x: 3213, y: 3428, description: "Capital of Misthalin", wikiPage: "Varrock" },
  { name: "Falador", category: "city", x: 2964, y: 3378, description: "Capital of Asgarnia", wikiPage: "Falador" },
  { name: "Ardougne", category: "city", x: 2661, y: 3305, description: "Capital of Kandarin", wikiPage: "Ardougne" },
  { name: "Edgeville", category: "city", x: 3087, y: 3496, description: "Border town near Wilderness", wikiPage: "Edgeville" },
  { name: "Camelot", category: "city", x: 2757, y: 3477, description: "Home of the Knights", wikiPage: "Camelot" },
  { name: "Prifddinas", category: "city", x: 3265, y: 6060, description: "Elven city", wikiPage: "Prifddinas" },

  // Bosses
  { name: "Vorkath", category: "boss", x: 2273, y: 4049, description: "Dragon boss (DS2)", wikiPage: "Vorkath" },
  { name: "Zulrah", category: "boss", x: 2204, y: 3056, description: "Serpent boss", wikiPage: "Zulrah" },
  { name: "General Graardor", category: "boss", x: 2864, y: 5362, description: "Bandos GWD", wikiPage: "General Graardor" },
  { name: "Kree'arra", category: "boss", x: 2839, y: 5296, description: "Armadyl GWD", wikiPage: "Kree'arra" },
  { name: "Cerberus", category: "boss", x: 1310, y: 1237, description: "Hellhound boss (91 Slayer)", wikiPage: "Cerberus" },
  { name: "Alchemical Hydra", category: "boss", x: 1364, y: 10265, description: "Slayer boss", wikiPage: "Alchemical Hydra" },
  { name: "Giant Mole", category: "boss", x: 1752, y: 5237, description: "Under Falador Park", wikiPage: "Giant Mole" },
  { name: "Corporeal Beast", category: "boss", x: 2966, y: 4382, description: "Corp cave", wikiPage: "Corporeal Beast" },
  { name: "Dagannoth Kings", category: "boss", x: 2442, y: 10147, description: "Waterbirth Island", wikiPage: "Dagannoth Kings" },
  { name: "Kalphite Queen", category: "boss", x: 3226, y: 3108, description: "Kalphite Lair", wikiPage: "Kalphite Queen" },
  { name: "King Black Dragon", category: "boss", x: 2271, y: 4680, description: "KBD Lair", wikiPage: "King Black Dragon" },

  // Fairy Rings (selected)
  { name: "CKS - Canifis", category: "fairy-ring", x: 3447, y: 3470, description: "Fairy ring CKS" },
  { name: "AKQ - Piscatoris", category: "fairy-ring", x: 2319, y: 3619, description: "Fairy ring AKQ" },
  { name: "CIP - Miscellania", category: "fairy-ring", x: 2513, y: 3884, description: "Fairy ring CIP" },
  { name: "DKS - Snowy hunter", category: "fairy-ring", x: 2744, y: 3720, description: "Fairy ring DKS" },
  { name: "ALS - McGrubor's", category: "fairy-ring", x: 2644, y: 3495, description: "Fairy ring ALS" },
  { name: "BIP - Polypore", category: "fairy-ring", x: 3410, y: 3324, description: "Fairy ring BIP" },

  // Spirit Trees (selected)
  { name: "Grand Exchange", category: "spirit-tree", x: 3183, y: 3508, description: "Spirit tree at GE" },
  { name: "Tree Gnome Village", category: "spirit-tree", x: 2542, y: 3170, description: "Spirit tree at gnome village" },
  { name: "Tree Gnome Stronghold", category: "spirit-tree", x: 2461, y: 3444, description: "Spirit tree at stronghold" },

  // Slayer locations
  { name: "Slayer Tower", category: "slayer", x: 3428, y: 3538, description: "Aberrant spectres, gargoyles", wikiPage: "Slayer Tower" },
  { name: "Catacombs of Kourend", category: "slayer", x: 1665, y: 10050, description: "Multi-combat slayer dungeon", wikiPage: "Catacombs of Kourend" },
  { name: "Stronghold Slayer Cave", category: "slayer", x: 2430, y: 9823, description: "Nieve/Steve's cave", wikiPage: "Stronghold Slayer Cave" },

  // Minigames
  { name: "Chambers of Xeric", category: "minigame", x: 1233, y: 3573, description: "Raid 1", wikiPage: "Chambers of Xeric" },
  { name: "Theatre of Blood", category: "minigame", x: 3671, y: 3219, description: "Raid 2", wikiPage: "Theatre of Blood" },
  { name: "Wintertodt", category: "minigame", x: 1631, y: 3940, description: "Firemaking boss", wikiPage: "Wintertodt" },
  { name: "Tempoross", category: "minigame", x: 3135, y: 2840, description: "Fishing boss", wikiPage: "Tempoross" },
  { name: "The Gauntlet", category: "minigame", x: 3033, y: 6124, description: "Prifddinas challenge", wikiPage: "The Gauntlet" },
  { name: "Fight Caves", category: "minigame", x: 2438, y: 5168, description: "TzTok-Jad", wikiPage: "TzHaar Fight Cave" },
  { name: "Inferno", category: "minigame", x: 2438, y: 5116, description: "TzKal-Zuk", wikiPage: "The Inferno" },

  // Teleport locations
  { name: "Lumbridge Home Teleport", category: "teleport", x: 3222, y: 3218, description: "Default spellbook", wikiPage: "Lumbridge Home Teleport" },
  { name: "Varrock Teleport", category: "teleport", x: 3213, y: 3424, description: "25 Magic", wikiPage: "Varrock Teleport" },
  { name: "Falador Teleport", category: "teleport", x: 2965, y: 3378, description: "37 Magic", wikiPage: "Falador Teleport" },
  { name: "Camelot Teleport", category: "teleport", x: 2757, y: 3478, description: "45 Magic", wikiPage: "Camelot Teleport" },
  { name: "Ardougne Teleport", category: "teleport", x: 2661, y: 3305, description: "51 Magic", wikiPage: "Ardougne Teleport" },
  { name: "Trollheim Teleport", category: "teleport", x: 2891, y: 3676, description: "61 Magic — Eadgar's Ruse", wikiPage: "Trollheim Teleport" },
  { name: "Kourend Castle Teleport", category: "teleport", x: 1643, y: 3672, description: "69 Magic", wikiPage: "Kourend Castle Teleport" },
  { name: "Watchtower Teleport", category: "teleport", x: 2547, y: 3113, description: "58 Magic — Yanille", wikiPage: "Watchtower Teleport" },

  // Skilling locations
  { name: "Fishing Guild", category: "skilling", x: 2611, y: 3392, description: "68 Fishing", wikiPage: "Fishing Guild" },
  { name: "Mining Guild", category: "skilling", x: 3046, y: 9756, description: "60 Mining", wikiPage: "Mining Guild" },
  { name: "Woodcutting Guild", category: "skilling", x: 1658, y: 3504, description: "60 Woodcutting", wikiPage: "Woodcutting Guild" },
  { name: "Farming Guild", category: "skilling", x: 1248, y: 3726, description: "45 Farming", wikiPage: "Farming Guild" },
  { name: "Blast Furnace", category: "skilling", x: 2931, y: 10196, description: "Keldagrim smelting", wikiPage: "Blast Furnace" },
  { name: "Motherlode Mine", category: "skilling", x: 3725, y: 5659, description: "30 Mining — Dwarven Mine", wikiPage: "Motherlode Mine" },
  { name: "Crafting Guild", category: "skilling", x: 2933, y: 3289, description: "40 Crafting", wikiPage: "Crafting Guild" },
  { name: "Cooking Guild", category: "skilling", x: 3143, y: 3443, description: "32 Cooking — Varrock", wikiPage: "Cooking Guild" },

  // Quest start points
  { name: "Dragon Slayer II", category: "quest", x: 3208, y: 3497, description: "Grandmaster quest — Myths' Guild", wikiPage: "Dragon Slayer II" },
  { name: "Song of the Elves", category: "quest", x: 2353, y: 3170, description: "Grandmaster quest — Lletya", wikiPage: "Song of the Elves" },
  { name: "Desert Treasure II", category: "quest", x: 3310, y: 2784, description: "Grandmaster quest — Al Kharid", wikiPage: "Desert Treasure II - The Fallen Empire" },
  { name: "Monkey Madness II", category: "quest", x: 2805, y: 2793, description: "Grandmaster quest — Ape Atoll", wikiPage: "Monkey Madness II" },
  { name: "Recipe for Disaster", category: "quest", x: 3208, y: 3217, description: "Grandmaster quest — Lumbridge", wikiPage: "Recipe for Disaster" },
  { name: "A Night at the Theatre", category: "quest", x: 3671, y: 3219, description: "Master quest — Ver Sinhaza", wikiPage: "A Night at the Theatre" },

  // Additional cities
  { name: "Fossil Island", category: "city", x: 3764, y: 3869, description: "Ancient research island", wikiPage: "Fossil Island" },
  { name: "Hosidius", category: "city", x: 1744, y: 3517, description: "Kourend — farming & cooking", wikiPage: "Hosidius" },
  { name: "Port Sarim", category: "city", x: 3023, y: 3208, description: "Fishing & transport hub", wikiPage: "Port Sarim" },
  { name: "Zanaris", category: "city", x: 2412, y: 4434, description: "Fairy realm — Lost City", wikiPage: "Zanaris" },
  { name: "Mor Ul Rek", category: "city", x: 2444, y: 5170, description: "TzHaar city — fire cape", wikiPage: "Mor Ul Rek" },

  // Additional bosses
  { name: "Barrows", category: "boss", x: 3565, y: 3298, description: "Six brothers — Morytania", wikiPage: "Barrows" },
  { name: "Sarachnis", category: "boss", x: 1847, y: 9899, description: "Spider boss — Forthos Dungeon", wikiPage: "Sarachnis" },
  { name: "The Gauntlet (boss)", category: "boss", x: 3033, y: 6124, description: "Hunllef — Prifddinas", wikiPage: "The Gauntlet" },

  // Additional minigames
  { name: "Pest Control", category: "minigame", x: 2662, y: 2649, description: "Void Knight outpost", wikiPage: "Pest Control" },
  { name: "Nightmare Zone", category: "minigame", x: 2609, y: 3115, description: "Dominic's dream — Yanille", wikiPage: "Nightmare Zone" },
  { name: "Guardians of the Rift", category: "minigame", x: 3614, y: 9480, description: "Runecraft minigame", wikiPage: "Guardians of the Rift" },
  { name: "Mage Training Arena", category: "minigame", x: 3363, y: 3318, description: "Magic training — Al Kharid", wikiPage: "Mage Training Arena" },
  { name: "Barbarian Assault", category: "minigame", x: 2531, y: 3570, description: "Team minigame — Fighter Torso", wikiPage: "Barbarian Assault" },

  // Agility Shortcuts
  { name: "Taverly dungeon pipe", category: "shortcut", x: 2886, y: 9799, description: "70 Agility", wikiPage: "Agility shortcut" },
  { name: "GE shortcut", category: "shortcut", x: 3143, y: 3514, description: "21 Agility — GE to Edgeville", wikiPage: "Agility shortcut" },
  { name: "Falador wall", category: "shortcut", x: 2935, y: 3355, description: "5 Agility", wikiPage: "Agility shortcut" },
  { name: "Karamja stepping stones", category: "shortcut", x: 2924, y: 2946, description: "12 Agility — Shilo Village", wikiPage: "Agility shortcut" },
  { name: "Slayer Tower chain", category: "shortcut", x: 3422, y: 3550, description: "61 Agility", wikiPage: "Agility shortcut" },
  { name: "Yanille wall", category: "shortcut", x: 2556, y: 3072, description: "65 Agility", wikiPage: "Agility shortcut" },
  { name: "Trollheim rocks", category: "shortcut", x: 2869, y: 3673, description: "47 Agility — shortcut to GWD", wikiPage: "Agility shortcut" },
  { name: "Arandar pass", category: "shortcut", x: 2334, y: 3288, description: "85 Agility — to Tirannwn", wikiPage: "Agility shortcut" },
  { name: "Cosmic altar shortcut", category: "shortcut", x: 2399, y: 4403, description: "66 Agility", wikiPage: "Agility shortcut" },
  { name: "Arceuus essence mine", category: "shortcut", x: 1755, y: 3872, description: "73 Agility", wikiPage: "Agility shortcut" },
  { name: "Brimhaven dungeon vines", category: "shortcut", x: 2672, y: 9544, description: "87 Agility", wikiPage: "Agility shortcut" },
  { name: "Kalphite lair shortcut", category: "shortcut", x: 3226, y: 3109, description: "86 Agility — to KQ", wikiPage: "Agility shortcut" },

  // Boats & Transport
  { name: "Port Sarim → Karamja", category: "boat", x: 3029, y: 3217, description: "30gp charter", wikiPage: "Port Sarim" },
  { name: "Ardougne → Brimhaven", category: "boat", x: 2681, y: 3275, description: "30gp charter", wikiPage: "Ardougne" },
  { name: "Rellekka → Neitiznot", category: "boat", x: 2645, y: 3710, description: "Free — The Fremennik Isles", wikiPage: "Rellekka" },
  { name: "Rellekka → Waterbirth", category: "boat", x: 2620, y: 3682, description: "Free — DKS access", wikiPage: "Rellekka" },
  { name: "Port Piscarilius → Land's End", category: "boat", x: 1824, y: 3691, description: "Free Kourend boat", wikiPage: "Port Piscarilius" },
  { name: "Gnome glider — Al Kharid", category: "boat", x: 3278, y: 3212, description: "Glider network", wikiPage: "Gnome glider" },
  { name: "Gnome glider — Karamja", category: "boat", x: 2970, y: 2972, description: "Glider network", wikiPage: "Gnome glider" },
  { name: "Gnome glider — Feldip Hills", category: "boat", x: 2544, y: 2970, description: "Glider network", wikiPage: "Gnome glider" },
  { name: "Gnome glider — White Wolf", category: "boat", x: 2848, y: 3497, description: "Glider network", wikiPage: "Gnome glider" },
  { name: "Gnome glider — Grand Tree", category: "boat", x: 2465, y: 3501, description: "Glider hub", wikiPage: "Gnome glider" },
  { name: "Magic carpet — Shantay", category: "boat", x: 3311, y: 3109, description: "200gp carpet ride", wikiPage: "Magic carpet" },
  { name: "Magic carpet — Pollnivneach", category: "boat", x: 3351, y: 2942, description: "200gp carpet ride", wikiPage: "Magic carpet" },
  { name: "Magic carpet — Nardah", category: "boat", x: 3400, y: 2916, description: "200gp carpet ride", wikiPage: "Magic carpet" },
  { name: "Charter ship — Port Sarim", category: "boat", x: 3038, y: 3192, description: "Charter ship network", wikiPage: "Charter ship" },
  { name: "Charter ship — Catherby", category: "boat", x: 2792, y: 3414, description: "Charter ship network", wikiPage: "Charter ship" },
  { name: "Charter ship — Brimhaven", category: "boat", x: 2763, y: 3237, description: "Charter ship network", wikiPage: "Charter ship" },
  { name: "Charter ship — Port Khazard", category: "boat", x: 2674, y: 3141, description: "Charter ship network", wikiPage: "Charter ship" },
  { name: "Charter ship — Corsair Cove", category: "boat", x: 2587, y: 2851, description: "Charter ship network", wikiPage: "Charter ship" },
];

export const MARKER_COLORS: Record<MarkerCategory, string> = {
  boss: "#ef4444",
  city: "#3b82f6",
  "fairy-ring": "#a78bfa",
  "spirit-tree": "#22c55e",
  teleport: "#f59e0b",
  slayer: "#f97316",
  skilling: "#2dd4bf",
  minigame: "#e879f9",
  quest: "#fbbf24",
  shortcut: "#06b6d4",
  boat: "#8b5cf6",
};

export const MARKER_LABELS: Record<MarkerCategory, string> = {
  boss: "Bosses",
  city: "Cities",
  "fairy-ring": "Fairy Rings",
  "spirit-tree": "Spirit Trees",
  teleport: "Teleports",
  slayer: "Slayer",
  skilling: "Skilling",
  minigame: "Minigames",
  quest: "Quests",
  shortcut: "Shortcuts",
  boat: "Boats & Gliders",
};
