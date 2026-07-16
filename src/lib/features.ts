export const FEATURE_REGISTRY = {
  home: {
    title: "Home",
    navLabel: "Home",
    family: "Home",
    sidebar: true,
    search: true,
    aliases: ["home", "dashboard", "command center"],
  },
  overview: {
    title: "Your Profile",
    navLabel: "Profile",
    family: "Player",
    sidebar: true,
    search: true,
    aliases: ["overview", "profile", "account", "stats"],
  },
  lookup: {
    title: "Hiscores Lookup",
    navLabel: "Hiscores",
    family: "Player",
    // Profile + PlayerBar cover the common path; full lookup stays in search.
    sidebar: false,
    search: true,
    aliases: ["lookup", "hiscores", "player lookup", "search player"],
  },
  "collection-log": {
    title: "Collection Log",
    navLabel: "Collection Log",
    family: "Player",
    sidebar: true,
    search: true,
    aliases: ["collection log", "collection", "log", "obtained"],
  },
  tracker: {
    title: "XP Tracker",
    navLabel: "XP Tracker",
    family: "Player",
    sidebar: true,
    search: true,
    aliases: ["tracker", "wise old man", "gains"],
  },
  "skill-calc": {
    title: "Skill Calculator",
    navLabel: "Skill Calculator",
    family: "Calculators",
    sidebar: true,
    search: true,
    aliases: ["skills", "skill calculator", "training", "xp", "level", "training method", "construction"],
  },
  "dps-calc": {
    title: "DPS Calculator",
    navLabel: "DPS Calculator",
    family: "Combat",
    sidebar: true,
    search: true,
    aliases: ["dps", "damage", "max hit", "combat", "accuracy", "monster", "loadout"],
  },
  "dry-calc": {
    title: "Dry Calculator",
    navLabel: "Dry Calculator",
    family: "Calculators",
    // Search + home tool grid; keeps the sidebar focused on daily drivers.
    sidebar: false,
    search: true,
    aliases: ["dry", "drop chance", "rng"],
  },
  "training-plan": {
    title: "Training Plan",
    navLabel: "Training Plan",
    family: "Calculators",
    sidebar: false,
    search: true,
    aliases: ["training plan", "level plan", "goal", "targets", "efficient", "xp per hour"],
  },
  "gear-compare": {
    title: "Gear Compare",
    navLabel: "Gear Compare",
    family: "Combat",
    sidebar: true,
    search: true,
    aliases: ["gear", "equipment", "compare", "bis", "best in slot"],
  },
  "pet-calc": {
    title: "Pet Calculator",
    navLabel: "Pet Calculator",
    family: "Calculators",
    sidebar: false,
    search: true,
    aliases: ["pet", "pet chance", "pet calculator"],
  },
  bosses: {
    title: "Boss Guides",
    navLabel: "Boss Guides",
    family: "Combat",
    sidebar: true,
    search: true,
    aliases: ["boss", "guide", "strategy"],
  },
  raids: {
    title: "Raid Guides",
    navLabel: "Raid Guides",
    family: "Combat",
    sidebar: true,
    search: true,
    aliases: ["raids", "cox", "tob", "toa", "chambers", "theatre", "tombs", "raid guide"],
  },
  loot: {
    title: "Loot",
    navLabel: "Loot",
    family: "Combat",
    sidebar: true,
    search: true,
    aliases: ["drops", "drop tables", "loot", "boss loot", "gp per kill", "loot calc"],
  },
  "combat-tasks": {
    title: "Combat Tasks",
    navLabel: "Combat Tasks",
    family: "Combat",
    sidebar: false,
    search: true,
    aliases: ["combat achievements", "ca", "combat tasks"],
  },
  market: {
    title: "Items & Watchlist",
    navLabel: "Items",
    family: "Market",
    sidebar: true,
    search: true,
    aliases: ["grand exchange", "item database", "prices", "ge", "items", "alch", "high alch", "alchemy", "watchlist", "price alerts", "flip finder", "flips", "flipping", "margins", "best flips", "profit"],
  },
  "flip-journal": {
    title: "GE Flip Journal",
    navLabel: "Flip Journal",
    family: "Market",
    sidebar: true,
    search: true,
    aliases: ["flip", "flipping", "flip journal", "ge flipping", "profit journal", "flip log"],
  },
  progress: {
    title: "Character Progress",
    navLabel: "Character Progress",
    family: "Player",
    sidebar: false,
    search: true,
    aliases: ["quests", "quest requirements", "diaries", "achievement diaries", "progress", "combat tasks", "combat achievements"],
  },
  slayer: {
    title: "Slayer Helper",
    navLabel: "Slayer Helper",
    family: "Combat",
    sidebar: true,
    search: true,
    aliases: ["slayer", "slayer blocks", "task weights", "block list", "slayer helper", "slayer master"],
  },
  "clue-helper": {
    title: "Clue Helper",
    navLabel: "Clue Helper",
    family: "Live",
    sidebar: true,
    search: true,
    aliases: ["clues", "clue helper"],
  },
  "money-making": {
    title: "Money Making",
    navLabel: "Money Making",
    family: "Market",
    sidebar: true,
    search: true,
    aliases: ["money making", "gp", "methods", "gp per hour", "hourly", "gold"],
  },
  "production-calc": {
    title: "Recipe Calculator",
    navLabel: "Recipe Calculator",
    family: "Calculators",
    sidebar: false,
    search: true,
    aliases: ["production", "crafting", "recipes", "cost calculator", "profit calculator", "herblore", "smithing"],
  },
  "shop-helper": {
    title: "Shop Helper",
    navLabel: "Shop Helper",
    family: "Market",
    sidebar: false,
    search: true,
    aliases: ["shop", "shops", "store", "npc", "buy", "sell", "shopkeeper"],
  },
  kingdom: {
    title: "Kingdom of Miscellania",
    navLabel: "Kingdom Calculator",
    family: "Calculators",
    sidebar: false,
    search: true,
    aliases: ["kingdom", "miscellania", "managing miscellania", "throne of miscellania", "workers", "kingdom calculator"],
  },
  spells: {
    title: "Spells",
    navLabel: "Spells",
    family: "Market",
    sidebar: false,
    search: true,
    aliases: ["spells", "spellbook", "magic", "runes", "ancient", "lunar", "arceuus"],
  },
  "world-map": {
    title: "World Map",
    navLabel: "World Map",
    family: "Live",
    sidebar: false,
    search: true,
    aliases: ["map", "world map", "locations", "bosses map", "fairy rings", "teleports"],
  },
  stars: {
    title: "Star Helper",
    navLabel: "Star Helper",
    family: "Live",
    sidebar: true,
    search: true,
    aliases: ["stars", "star miners", "shooting stars", "star helper"],
  },
  news: {
    title: "OSRS News",
    navLabel: "OSRS News",
    family: "Live",
    sidebar: false,
    search: true,
    aliases: ["news", "blog", "updates", "patch notes", "announcements"],
  },
  wiki: {
    title: "OSRS Wiki",
    navLabel: "OSRS Wiki",
    family: "Live",
    sidebar: true,
    search: true,
    aliases: ["wiki", "wiki lookup", "search wiki", "look up anything"],
  },
  timers: {
    title: "Farm Timers",
    navLabel: "Farming Timers",
    family: "Calculators",
    sidebar: true,
    search: true,
    aliases: ["timers", "farm timers", "farming", "crops", "birdhouse", "farm run", "farm profit"],
  },
  "xp-table": {
    title: "XP Table",
    navLabel: "XP Table",
    family: "Calculators",
    sidebar: false,
    search: true,
    aliases: ["xp table", "levels"],
  },
  watchlist: {
    title: "Watchlist",
    navLabel: "Watchlist",
    family: "Market",
    sidebar: false,
    search: false,
    aliases: [],
  },
  settings: {
    title: "Settings",
    navLabel: "Settings",
    family: "Settings",
    sidebar: false,
    search: true,
    aliases: ["settings", "preferences"],
  },
  about: {
    title: "About",
    navLabel: "About",
    family: "Settings",
    sidebar: false,
    search: true,
    aliases: ["about", "credits"],
  },
} as const;

export type View = keyof typeof FEATURE_REGISTRY;
export type FeatureFamily = (typeof FEATURE_REGISTRY)[View]["family"];

export interface FeatureDefinition {
  id: View;
  title: string;
  navLabel: string;
  family: FeatureFamily;
  sidebar: boolean;
  search: boolean;
  aliases: readonly string[];
}

export const FEATURE_LIST: FeatureDefinition[] = Object.entries(
  FEATURE_REGISTRY
).map(([id, config]) => ({
  id: id as View,
  ...config,
}));

export const SIDEBAR_FEATURES = FEATURE_LIST.filter((feature) => feature.sidebar);

export const SEARCHABLE_FEATURES = FEATURE_LIST.filter((feature) => feature.search);

// Sidebar hub order (5 coherent groups). Home renders without a header
// since it's a single item; every sidebar:true feature maps to one of these.
export const FEATURE_FAMILIES: FeatureFamily[] = [
  "Home",
  "Player",
  "Combat",
  "Market",
  "Calculators",
  "Live",
];

export function getFeature(view: View): FeatureDefinition {
  return FEATURE_LIST.find((feature) => feature.id === view) ?? FEATURE_LIST[0]!;
}
