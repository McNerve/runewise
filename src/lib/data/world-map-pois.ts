/**
 * Curated list of world map POIs for the World Map overlay.
 *
 * Coordinates are percentages relative to the static OSRS world map JPG
 * (cdn.runescape.com .../osrs_world_map.jpg). The image is a single flat
 * raster — not the Leaflet tile grid — so these are simple % x/y anchors
 * rather than game-world coords. Hand-placed from the 2025-11-18 map
 * revision; accurate to roughly +/- 0.3% of image dimensions.
 */

export type PoiCategory =
  | "farming"
  | "fairy-ring"
  | "slayer"
  | "altar"
  | "teleport";

export interface WorldMapPoi {
  id: string;
  category: PoiCategory;
  name: string;
  /** Short description shown on hover / popup */
  info?: string;
  /** x coordinate in percent (0 = left edge, 100 = right edge) */
  x: number;
  /** y coordinate in percent (0 = top edge, 100 = bottom edge) */
  y: number;
  /** Optional wiki page slug (appended to https://oldschool.runescape.wiki/w/) */
  wiki?: string;
}

export const CATEGORY_META: Record<
  PoiCategory,
  { label: string; color: string; border: string }
> = {
  farming: { label: "Farming", color: "#22c55e", border: "#166534" },
  "fairy-ring": { label: "Fairy Rings", color: "#a855f7", border: "#6b21a8" },
  slayer: { label: "Slayer", color: "#ef4444", border: "#991b1b" },
  altar: { label: "Altars", color: "#f5f5f4", border: "#78716c" },
  teleport: { label: "Teleports", color: "#3b82f6", border: "#1e40af" },
};

// ── Farming patches ─────────────────────────────────────────────────────
// Covers the main herb/tree/allotment/fruit-tree circuits plus a few specials.
const FARMING: WorldMapPoi[] = [
  { id: "farm-falador-allot", category: "farming", name: "Falador allotment/herb/flower", info: "North of Falador", x: 42.6, y: 55.6, wiki: "Falador" },
  { id: "farm-catherby-allot", category: "farming", name: "Catherby allotment/herb/flower", info: "East of Catherby bank", x: 55.9, y: 50.3, wiki: "Catherby" },
  { id: "farm-ardougne-allot", category: "farming", name: "Ardougne allotment/herb/flower", info: "North Ardougne", x: 36.8, y: 55.7, wiki: "Ardougne" },
  { id: "farm-morytania-herb", category: "farming", name: "Morytania herb/allotment", info: "Trouble Brewing area (Port Phasmatys)", x: 60.8, y: 55.4, wiki: "Morytania" },
  { id: "farm-harmony-herb", category: "farming", name: "Harmony Island herb", info: "Requires The Great Brain Robbery", x: 58.7, y: 75.2, wiki: "Harmony_Island" },
  { id: "farm-troll-herb", category: "farming", name: "Troll Stronghold herb", info: "My Arm's Big Adventure", x: 48.1, y: 27.2, wiki: "Weiss" },
  { id: "farm-weiss-herb", category: "farming", name: "Weiss herb", info: "Making Friends with My Arm", x: 47.9, y: 22.9, wiki: "Weiss" },
  { id: "farm-hosidius-herb", category: "farming", name: "Hosidius herb/allotment", info: "Kourend — needs 100% Hosidius favour", x: 30.2, y: 66.8, wiki: "Hosidius" },
  { id: "farm-farming-guild-herb", category: "farming", name: "Farming Guild herb/tree/fruit", info: "Requires 65/85 Farming", x: 28.1, y: 56.1, wiki: "Farming_Guild" },

  { id: "farm-lumbridge-tree", category: "farming", name: "Lumbridge tree patch", info: "Next to the Combat Tutor", x: 51.6, y: 61.4, wiki: "Lumbridge" },
  { id: "farm-varrock-tree", category: "farming", name: "Varrock tree patch", info: "North of Varrock castle", x: 51.2, y: 51.6, wiki: "Varrock" },
  { id: "farm-falador-tree", category: "farming", name: "Falador tree patch", info: "Falador Park", x: 42.0, y: 56.4, wiki: "Falador" },
  { id: "farm-taverley-tree", category: "farming", name: "Taverley tree patch", info: "South of Taverley", x: 44.5, y: 53.3, wiki: "Taverley" },
  { id: "farm-gnome-stronghold-tree", category: "farming", name: "Gnome Stronghold tree", info: "West end of stronghold", x: 33.0, y: 48.4, wiki: "Tree_Gnome_Stronghold" },

  { id: "farm-catherby-fruit", category: "farming", name: "Catherby fruit tree", info: "On the Catherby circuit", x: 55.6, y: 50.5, wiki: "Catherby" },
  { id: "farm-brimhaven-fruit", category: "farming", name: "Brimhaven fruit tree", info: "East of Brimhaven", x: 55.7, y: 65.7, wiki: "Brimhaven" },
  { id: "farm-gnome-village-fruit", category: "farming", name: "Gnome Village fruit tree", info: "Tree Gnome Village maze", x: 36.4, y: 58.9, wiki: "Tree_Gnome_Village" },
  { id: "farm-tree-gnome-fruit", category: "farming", name: "Gnome Stronghold fruit tree", info: "Near grand tree", x: 33.3, y: 48.0, wiki: "Tree_Gnome_Stronghold" },
  { id: "farm-lletya-fruit", category: "farming", name: "Lletya fruit tree", info: "Mourning's End Part I", x: 29.5, y: 61.0, wiki: "Lletya" },

  { id: "farm-champions-allot", category: "farming", name: "Champions' Guild allotment", info: "South-west of Varrock", x: 50.5, y: 55.8, wiki: "Champions%27_Guild" },
  { id: "farm-port-phas-allot", category: "farming", name: "Port Phasmatys allotment", info: "West of Port Phasmatys", x: 60.5, y: 54.5, wiki: "Port_Phasmatys" },

  { id: "farm-hops-lumbridge", category: "farming", name: "Lumbridge hops", info: "East of Lumbridge castle", x: 52.0, y: 61.8, wiki: "Lumbridge" },
  { id: "farm-hops-seers", category: "farming", name: "Seers' Village hops", info: "McGrubor's Wood area", x: 52.9, y: 51.1, wiki: "Seers%27_Village" },
  { id: "farm-hops-yanille", category: "farming", name: "Yanille hops", info: "North-east of Yanille", x: 37.8, y: 62.8, wiki: "Yanille" },

  { id: "farm-bush-ardougne", category: "farming", name: "Ardougne bush patch", info: "South-east of Ardougne", x: 37.5, y: 57.0, wiki: "Ardougne" },
  { id: "farm-bush-rimmington", category: "farming", name: "Rimmington bush", info: "West of Rimmington", x: 44.0, y: 59.3, wiki: "Rimmington" },
  { id: "farm-bush-champions", category: "farming", name: "Etceteria bush", info: "Fremennik isles", x: 50.4, y: 40.3, wiki: "Etceteria" },
  { id: "farm-bush-farming-guild", category: "farming", name: "Farming Guild bush", info: "Tier 45", x: 28.3, y: 56.0, wiki: "Farming_Guild" },

  { id: "farm-spirit-port-sarim", category: "farming", name: "Port Sarim spirit tree", info: "Etceteria requires diary", x: 45.4, y: 61.2, wiki: "Spirit_tree" },
  { id: "farm-spirit-gnome-village", category: "farming", name: "Gnome Village spirit tree", info: "Default unlocked", x: 36.7, y: 59.0, wiki: "Spirit_tree" },
  { id: "farm-spirit-stronghold", category: "farming", name: "Gnome Stronghold spirit tree", info: "Default unlocked", x: 33.2, y: 48.1, wiki: "Spirit_tree" },
  { id: "farm-spirit-battlefield", category: "farming", name: "Battlefield of Khazard spirit tree", info: "Default unlocked", x: 38.6, y: 62.3, wiki: "Spirit_tree" },

  { id: "farm-special-cactus", category: "farming", name: "Al Kharid cactus patch", info: "Behind mining guild entrance", x: 54.2, y: 64.4, wiki: "Al_Kharid" },
  { id: "farm-special-redwood", category: "farming", name: "Farming Guild redwood", info: "Requires 90 Farming", x: 28.0, y: 55.8, wiki: "Redwood" },
  { id: "farm-special-celastrus", category: "farming", name: "Farming Guild celastrus", info: "Requires 85 Farming", x: 28.2, y: 55.9, wiki: "Celastrus_tree" },
  { id: "farm-special-calquat", category: "farming", name: "Tai Bwo Wannai calquat", info: "Karamja village", x: 51.7, y: 70.2, wiki: "Tai_Bwo_Wannai" },
];

// ── Fairy rings (code + approx world-image coord) ──────────────────────
const FAIRY_RINGS: WorldMapPoi[] = [
  { id: "fr-aiq", category: "fairy-ring", name: "AIQ — Asgarnia ice dungeon", x: 44.0, y: 59.0, wiki: "Fairy_ring" },
  { id: "fr-aiR", category: "fairy-ring", name: "AIR — Islands south of Mos Le'Harmless", x: 56.1, y: 78.4, wiki: "Fairy_ring" },
  { id: "fr-ajq", category: "fairy-ring", name: "AJQ — Dark cavern south of Dorgesh-Kaan", x: 51.8, y: 63.7, wiki: "Fairy_ring" },
  { id: "fr-ajr", category: "fairy-ring", name: "AJR — Slayer Tower, Morytania", x: 59.9, y: 52.2, wiki: "Fairy_ring" },
  { id: "fr-ajs", category: "fairy-ring", name: "AJS — Penguins near Ardougne Zoo", x: 37.2, y: 57.4, wiki: "Fairy_ring" },
  { id: "fr-akq", category: "fairy-ring", name: "AKQ — Piscatoris Hunter area", x: 31.9, y: 45.0, wiki: "Fairy_ring" },
  { id: "fr-aks", category: "fairy-ring", name: "AKS — Ape Atoll", x: 33.4, y: 79.7, wiki: "Fairy_ring" },
  { id: "fr-alp", category: "fairy-ring", name: "ALP — Lighthouse entrance (jutting)", x: 53.9, y: 45.0, wiki: "Fairy_ring" },
  { id: "fr-alq", category: "fairy-ring", name: "ALQ — Mort Myre swamp", x: 58.7, y: 54.6, wiki: "Fairy_ring" },
  { id: "fr-alr", category: "fairy-ring", name: "ALR — Lumbridge Swamp cave", x: 51.5, y: 64.0, wiki: "Fairy_ring" },
  { id: "fr-als", category: "fairy-ring", name: "ALS — Ourania Altar", x: 39.2, y: 57.6, wiki: "Fairy_ring" },
  { id: "fr-bip", category: "fairy-ring", name: "BIP — Gnome Stronghold", x: 33.3, y: 48.7, wiki: "Fairy_ring" },
  { id: "fr-biq", category: "fairy-ring", name: "BIQ — South of Ape Atoll", x: 33.5, y: 82.3, wiki: "Fairy_ring" },
  { id: "fr-bjs", category: "fairy-ring", name: "BJS — Etceteria", x: 50.3, y: 40.0, wiki: "Fairy_ring" },
  { id: "fr-bkp", category: "fairy-ring", name: "BKP — Troll Stronghold (deep)", x: 48.2, y: 26.6, wiki: "Fairy_ring" },
  { id: "fr-bkq", category: "fairy-ring", name: "BKQ — Mountain east of Rellekka", x: 49.7, y: 38.4, wiki: "Fairy_ring" },
  { id: "fr-bkr", category: "fairy-ring", name: "BKR — McGrubor's Wood", x: 41.0, y: 51.6, wiki: "Fairy_ring" },
  { id: "fr-bks", category: "fairy-ring", name: "BKS — South of Ardougne (hunter area)", x: 36.9, y: 61.7, wiki: "Fairy_ring" },
  { id: "fr-blp", category: "fairy-ring", name: "BLP — Island east of Zul-Andra", x: 30.9, y: 71.1, wiki: "Fairy_ring" },
  { id: "fr-blr", category: "fairy-ring", name: "BLR — Legends' Guild", x: 39.0, y: 54.0, wiki: "Fairy_ring" },
  { id: "fr-ciq", category: "fairy-ring", name: "CIQ — Outside Miscellania castle", x: 50.2, y: 39.0, wiki: "Fairy_ring" },
  { id: "fr-cip", category: "fairy-ring", name: "CIP — Miscellania centre", x: 50.0, y: 39.3, wiki: "Fairy_ring" },
  { id: "fr-cir", category: "fairy-ring", name: "CIR — Canifis", x: 58.4, y: 54.2, wiki: "Fairy_ring" },
  { id: "fr-cis", category: "fairy-ring", name: "CIS — North of Shilo Village", x: 49.5, y: 71.2, wiki: "Fairy_ring" },
  { id: "fr-cjr", category: "fairy-ring", name: "CJR — Ardougne Zoo enclosure", x: 37.2, y: 57.2, wiki: "Fairy_ring" },
  { id: "fr-ckp", category: "fairy-ring", name: "CKP — Sinclair Mansion", x: 46.3, y: 47.0, wiki: "Fairy_ring" },
  { id: "fr-ckr", category: "fairy-ring", name: "CKR — Kharazi Jungle", x: 41.2, y: 74.5, wiki: "Fairy_ring" },
  { id: "fr-ckq", category: "fairy-ring", name: "CKQ — Castle of Fisher Realm", x: 28.6, y: 62.6, wiki: "Fairy_ring" },
  { id: "fr-cks", category: "fairy-ring", name: "CKS — Ancient cavern", x: 53.6, y: 44.1, wiki: "Fairy_ring" },
  { id: "fr-clp", category: "fairy-ring", name: "CLP — Mort'ton graveyard", x: 58.4, y: 58.0, wiki: "Fairy_ring" },
  { id: "fr-clr", category: "fairy-ring", name: "CLR — Zul-Andra", x: 31.3, y: 70.8, wiki: "Fairy_ring" },
  { id: "fr-cls", category: "fairy-ring", name: "CLS — Island south of Tai Bwo Wannai", x: 51.0, y: 72.0, wiki: "Fairy_ring" },
  { id: "fr-dip", category: "fairy-ring", name: "DIP — Jungle near Tai Bwo Wannai", x: 51.5, y: 71.4, wiki: "Fairy_ring" },
  { id: "fr-diq", category: "fairy-ring", name: "DIQ — Uzer desert (Kharidian)", x: 58.6, y: 64.4, wiki: "Fairy_ring" },
  { id: "fr-dis", category: "fairy-ring", name: "DIS — Haunted Woods", x: 59.2, y: 55.5, wiki: "Fairy_ring" },
  { id: "fr-djp", category: "fairy-ring", name: "DJP — Tower of Life", x: 37.6, y: 63.6, wiki: "Fairy_ring" },
  { id: "fr-djr", category: "fairy-ring", name: "DJR — Sir Tiffy / Falador park area", x: 42.1, y: 56.4, wiki: "Fairy_ring" },
  { id: "fr-dkp", category: "fairy-ring", name: "DKP — Nature grotto, Mort Myre", x: 58.5, y: 54.9, wiki: "Fairy_ring" },
  { id: "fr-dkr", category: "fairy-ring", name: "DKR — Edgeville", x: 49.0, y: 54.5, wiki: "Fairy_ring" },
  { id: "fr-dks", category: "fairy-ring", name: "DKS — Snowy hunter area", x: 48.6, y: 20.5, wiki: "Fairy_ring" },
  { id: "fr-dlq", category: "fairy-ring", name: "DLQ — North of Nardah", x: 63.0, y: 71.9, wiki: "Fairy_ring" },
  { id: "fr-dlr", category: "fairy-ring", name: "DLR — Poison Waste (Tirannwn)", x: 29.5, y: 66.6, wiki: "Fairy_ring" },
  { id: "fr-djq", category: "fairy-ring", name: "DJQ — North-east of Zanaris entry", x: 54.3, y: 63.0, wiki: "Fairy_ring" },
];

// ── Slayer masters ──────────────────────────────────────────────────────
const SLAYER: WorldMapPoi[] = [
  { id: "sm-turael", category: "slayer", name: "Turael", info: "Burthorpe — combat 3 req", x: 45.4, y: 50.3, wiki: "Turael" },
  { id: "sm-spria", category: "slayer", name: "Spria", info: "Draynor — quest-locked alt for Turael", x: 48.9, y: 61.4, wiki: "Spria" },
  { id: "sm-mazchna", category: "slayer", name: "Mazchna", info: "Canifis — 20 combat", x: 58.4, y: 54.0, wiki: "Mazchna" },
  { id: "sm-vannaka", category: "slayer", name: "Vannaka", info: "Edgeville Dungeon — 40 combat", x: 49.1, y: 55.6, wiki: "Vannaka" },
  { id: "sm-chaeldar", category: "slayer", name: "Chaeldar", info: "Zanaris — 70 combat", x: 54.5, y: 62.8, wiki: "Chaeldar" },
  { id: "sm-konar", category: "slayer", name: "Konar quo Maten", info: "Mount Karuulm — 75 combat, 75 Slayer", x: 27.1, y: 69.8, wiki: "Konar_quo_Maten" },
  { id: "sm-nieve", category: "slayer", name: "Nieve / Steve", info: "Tree Gnome Stronghold — 85 combat", x: 33.2, y: 48.6, wiki: "Nieve" },
  { id: "sm-duradel", category: "slayer", name: "Duradel", info: "Shilo Village — 100 combat, 50 Slayer", x: 48.8, y: 70.5, wiki: "Duradel" },
  { id: "sm-krystilia", category: "slayer", name: "Krystilia", info: "Edgeville jail — Wilderness tasks", x: 49.2, y: 54.6, wiki: "Krystilia" },
];

// ── Prayer altars & other major altars ──────────────────────────────────
const ALTARS: WorldMapPoi[] = [
  { id: "altar-lumbridge", category: "altar", name: "Lumbridge church altar", info: "Free — near tutorial spawn", x: 51.5, y: 61.1, wiki: "Altar" },
  { id: "altar-edge-mon", category: "altar", name: "Edgeville Monastery altar", info: "+2 prayer restore", x: 47.2, y: 53.5, wiki: "Edgeville_Monastery" },
  { id: "altar-chaos", category: "altar", name: "Chaos Altar (Wilderness)", info: "50% chance bones don't consume", x: 50.0, y: 45.4, wiki: "Chaos_Altar" },
  { id: "altar-dark", category: "altar", name: "Dark Altar, Arceuus", info: "Teleport target — Arceuus spellbook", x: 29.0, y: 49.4, wiki: "Dark_Altar" },
  { id: "altar-zamorak-gwd", category: "altar", name: "Zamorak altar, Varrock church", info: "Saradomin + Zamorak shrines", x: 51.0, y: 52.2, wiki: "Varrock" },
  { id: "altar-piety-mon", category: "altar", name: "Prayer Guild altar", info: "+2 restore, members", x: 42.8, y: 57.5, wiki: "Prayer_Guild" },
  { id: "altar-ancient", category: "altar", name: "Ancient Altar, Jaldraocht", info: "Desert Treasure I reward", x: 61.0, y: 67.5, wiki: "Jaldraocht_Pyramid" },
  { id: "altar-nature", category: "altar", name: "Nature Grotto altar", info: "Mort Myre — Nature Spirit", x: 58.6, y: 55.1, wiki: "Nature_Grotto" },
  { id: "altar-ourania", category: "altar", name: "Ourania altar", info: "No-rune Runecrafting altar", x: 39.3, y: 57.8, wiki: "Ourania_Altar" },
  { id: "altar-kourend", category: "altar", name: "Hosidius altar", info: "Kourend — +15% XP zone", x: 30.1, y: 67.2, wiki: "Hosidius" },
];

// ── Teleport spots (popular POHs, city spells, misc) ────────────────────
const TELEPORTS: WorldMapPoi[] = [
  { id: "tele-lumbridge", category: "teleport", name: "Lumbridge teleport", info: "Standard spellbook — 41 magic", x: 51.5, y: 61.3, wiki: "Lumbridge_Teleport" },
  { id: "tele-varrock", category: "teleport", name: "Varrock teleport", info: "Standard — 25 magic", x: 51.1, y: 52.1, wiki: "Varrock_Teleport" },
  { id: "tele-falador", category: "teleport", name: "Falador teleport", info: "Standard — 37 magic", x: 41.7, y: 56.3, wiki: "Falador_Teleport" },
  { id: "tele-camelot", category: "teleport", name: "Camelot teleport", info: "Standard — 45 magic", x: 45.0, y: 50.8, wiki: "Camelot_Teleport" },
  { id: "tele-ardougne", category: "teleport", name: "Ardougne teleport", info: "Standard — 51 magic, quest", x: 37.5, y: 56.4, wiki: "Ardougne_Teleport" },
  { id: "tele-watchtower", category: "teleport", name: "Watchtower teleport", info: "Standard — 58 magic", x: 37.8, y: 63.0, wiki: "Watchtower_Teleport" },
  { id: "tele-trollheim", category: "teleport", name: "Trollheim teleport", info: "Standard — 61 magic, Eadgar's Ruse", x: 48.0, y: 28.4, wiki: "Trollheim_Teleport" },
  { id: "tele-kourend", category: "teleport", name: "Kourend Castle teleport", info: "Requires book of Kourend", x: 27.8, y: 63.1, wiki: "Kourend_Castle_Teleport" },
  { id: "tele-edgeville-home", category: "teleport", name: "Edgeville PoH portal hub", info: "Common PoH location", x: 49.0, y: 54.2, wiki: "Portal_nexus" },
  { id: "tele-rimmington-home", category: "teleport", name: "Rimmington PoH", info: "Free house spawn location", x: 44.0, y: 59.5, wiki: "Player-owned_house" },
  { id: "tele-yanille-home", category: "teleport", name: "Yanille PoH", info: "Members house location", x: 37.5, y: 63.3, wiki: "Yanille" },
  { id: "tele-pollnivneach-home", category: "teleport", name: "Pollnivneach PoH", info: "Desert house location", x: 58.4, y: 68.1, wiki: "Pollnivneach" },
  { id: "tele-home", category: "teleport", name: "Lumbridge home teleport", info: "Free, 30-min cooldown", x: 51.4, y: 61.1, wiki: "Home_Teleport" },
  { id: "tele-grand-exchange", category: "teleport", name: "Grand Exchange teleport", info: "Varrock tab / diary", x: 50.5, y: 51.2, wiki: "Grand_Exchange" },
  { id: "tele-castle-wars", category: "teleport", name: "Castle Wars teleport", info: "Ring of duelling / minigame tele", x: 37.1, y: 65.6, wiki: "Castle_Wars" },
  { id: "tele-barrows", category: "teleport", name: "Barrows teleport", info: "Ring of duelling / Barrows tab", x: 60.7, y: 55.8, wiki: "Barrows" },
];

export const WORLD_MAP_POIS: readonly WorldMapPoi[] = [
  ...FARMING,
  ...FAIRY_RINGS,
  ...SLAYER,
  ...ALTARS,
  ...TELEPORTS,
];

export function getPoisByCategory(category: PoiCategory | "all"): readonly WorldMapPoi[] {
  if (category === "all") return WORLD_MAP_POIS;
  return WORLD_MAP_POIS.filter((p) => p.category === category);
}
