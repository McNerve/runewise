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
    sidebar: true,
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
    family: "Tools",
    sidebar: true,
    search: true,
    aliases: ["skills", "skill calculator", "training", "xp", "level", "training method", "construction"],
  },
  "dps-calc": {
    title: "DPS Calculator",
    navLabel: "DPS Calculator",
    family: "Tools",
    sidebar: true,
    search: true,
    aliases: ["dps", "damage", "max hit", "combat", "accuracy", "monster", "loadout"],
  },
  "dry-calc": {
    title: "Dry Calculator",
    navLabel: "Dry Calculator",
    family: "Tools",
    sidebar: true,
    search: true,
    aliases: ["dry", "drop chance", "rng"],
  },
  "training-plan": {
    title: "Training Plan",
    navLabel: "Training Plan",
    family: "Planning",
    sidebar: false,
    search: true,
    aliases: ["training plan", "level plan", "goal", "targets", "efficient", "xp per hour"],
  },
  "gear-compare": {
    title: "Gear Compare",
    navLabel: "Gear Compare",
    family: "Planning",
    sidebar: true,
    search: true,
    aliases: ["gear", "equipment", "compare", "bis", "best in slot"],
  },
  "pet-calc": {
    title: "Pet Calculator",
    navLabel: "Pet Calculator",
    family: "Tools",
    sidebar: true,
    search: true,
    aliases: ["pet", "pet chance", "pet calculator"],
  },
  bosses: {
    title: "Boss Guides",
    navLabel: "Boss Guides",
    family: "Bossing",
    sidebar: true,
    search: true,
    aliases: ["boss", "guide", "strategy"],
  },
  raids: {
    title: "Raid Guides",
    navLabel: "Raid Guides",
    family: "Bossing",
    sidebar: true,
    search: true,
    aliases: ["raids", "cox", "tob", "toa", "chambers", "theatre", "tombs", "raid guide"],
  },
  loot: {
    title: "Loot",
    navLabel: "Loot",
    family: "Market",
    sidebar: true,
    search: true,
    aliases: ["drops", "drop tables", "loot", "boss loot", "gp per kill", "loot calc"],
  },
  "combat-tasks": {
    title: "Combat Tasks",
    navLabel: "Combat Tasks",
    family: "Bossing",
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
    aliases: ["grand exchange", "item database", "prices", "ge", "items", "alch", "high alch", "alchemy", "watchlist", "price alerts"],
  },
  progress: {
    title: "Character Progress",
    navLabel: "Character Progress",
    family: "Guides",
    sidebar: false,
    search: true,
    aliases: ["quests", "quest requirements", "diaries", "achievement diaries", "progress", "combat tasks", "combat achievements"],
  },
  slayer: {
    title: "Slayer Helper",
    navLabel: "Slayer Helper",
    family: "Guides",
    sidebar: true,
    search: true,
    aliases: ["slayer", "slayer blocks", "task weights", "block list", "slayer helper", "slayer master"],
  },
  "clue-helper": {
    title: "Clue Helper",
    navLabel: "Clue Helper",
    family: "Guides",
    sidebar: true,
    search: true,
    aliases: ["clues", "clue helper"],
  },
  "money-making": {
    title: "Money Making",
    navLabel: "Money Making",
    family: "Planning",
    sidebar: true,
    search: true,
    aliases: ["money making", "gp", "methods", "gp per hour", "hourly", "gold"],
  },
  "production-calc": {
    title: "Recipe Calculator",
    navLabel: "Recipe Calculator",
    family: "Tools",
    sidebar: true,
    search: true,
    aliases: ["production", "crafting", "recipes", "cost calculator", "profit calculator", "herblore", "smithing"],
  },
  kingdom: {
    title: "Kingdom of Miscellania",
    navLabel: "Kingdom Calculator",
    family: "Tools",
    sidebar: true,
    search: true,
    aliases: ["kingdom", "miscellania", "managing miscellania", "throne of miscellania", "workers", "kingdom calculator"],
  },
  spells: {
    title: "Spells",
    navLabel: "Spells",
    family: "Market",
    sidebar: true,
    search: true,
    aliases: ["spells", "spellbook", "magic", "runes", "ancient", "lunar", "arceuus"],
  },
  "world-map": {
    title: "World Map",
    navLabel: "World Map",
    family: "Live",
    sidebar: true,
    search: true,
    aliases: ["map", "world map", "locations", "bosses map", "fairy rings", "teleports"],
  },
  stars: {
    title: "Star Helper",
    navLabel: "Star Helper",
    family: "Guides",
    sidebar: true,
    search: true,
    aliases: ["stars", "star miners", "shooting stars", "star helper"],
  },
  news: {
    title: "OSRS News",
    navLabel: "OSRS News",
    family: "Live",
    sidebar: true,
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
    family: "Planning",
    sidebar: true,
    search: true,
    aliases: ["timers", "farm timers", "farming", "crops", "birdhouse", "farm run", "farm profit"],
  },
  "xp-table": {
    title: "XP Table",
    navLabel: "XP Table",
    family: "Tools",
    sidebar: false,
    search: true,
    aliases: ["xp table", "levels"],
  },
  "profit-hub": {
    title: "Profit Rankings",
    navLabel: "Profit Rankings",
    family: "Market",
    sidebar: false,
    search: true,
    aliases: ["profit", "rankings", "gp per hour", "best money", "profit comparison"],
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

export const FEATURE_FAMILIES = Array.from(
  new Set(SIDEBAR_FEATURES.map((feature) => feature.family))
);

export function getFeature(view: View): FeatureDefinition {
  return FEATURE_LIST.find((feature) => feature.id === view) ?? FEATURE_LIST[0]!;
}
