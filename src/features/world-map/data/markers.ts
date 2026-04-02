export type MarkerCategory =
  | "boss"
  | "city"
  | "fairy-ring"
  | "spirit-tree"
  | "teleport"
  | "slayer"
  | "skilling"
  | "minigame"
  | "quest";

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
  { name: "Cerberus", category: "boss", x: 1240, y: 1252, description: "Hellhound boss", wikiPage: "Cerberus" },
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
};
