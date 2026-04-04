export interface SlayerTask {
  monster: string;
  amount: string;
  weight: number;
  slayerLevel: number;
  combatLevel: number;
  /** Name of the reward unlock required to receive this task (if any) */
  requiredUnlock?: string;
}

export interface SlayerMaster {
  name: string;
  combatRequired: number;
  slayerRequired: number;
  location: string;
  pointsPerTask: number;
  tasks: SlayerTask[];
}

export type SlayerRewardCategory = "unlock" | "extend" | "buy" | "cosmetic";

export interface SlayerReward {
  name: string;
  cost: number;
  category: SlayerRewardCategory;
  description: string;
}

export const SLAYER_REWARD_CATEGORIES: Array<{
  id: SlayerRewardCategory;
  label: string;
  description: string;
}> = [
  { id: "unlock", label: "Unlocks", description: "Permanent task and mechanic unlocks" },
  { id: "extend", label: "Extensions", description: "Increase task assignment amounts" },
  { id: "buy", label: "Purchases", description: "Items you can buy with points" },
  { id: "cosmetic", label: "Cosmetics", description: "Slayer helmet recolours" },
];

export const SLAYER_REWARDS: SlayerReward[] = [
  // Unlocks
  { name: "Malevolent Masquerade", cost: 400, category: "unlock", description: "Unlock Slayer helmet assembly (55 Crafting)" },
  { name: "Broader Fletching", cost: 300, category: "unlock", description: "Unlock broad arrow (52 Fletch), broad bolt (55 Fletch), amethyst broad bolt (76 Fletch)" },
  { name: "Task Storage", cost: 500, category: "unlock", description: "Store one task to swap later — store/unstore is free" },
  { name: "Like a Boss", cost: 200, category: "unlock", description: "Konar, Duradel, Krystilia, Nieve can assign boss monsters" },
  { name: "Bigger and Badder", cost: 50, category: "unlock", description: "Superior Slayer monsters can spawn on task" },
  { name: "Ring Bling", cost: 150, category: "unlock", description: "Unlock Slayer ring crafting (75 Crafting)" },
  { name: "Gargoyle Smasher", cost: 120, category: "unlock", description: "Auto-finish gargoyles with rock hammer in inventory" },
  { name: "'Shroom Sprayer", cost: 110, category: "unlock", description: "Auto-finish mutated zygomites with fungicide spray in inventory" },
  { name: "Hot Stuff", cost: 100, category: "unlock", description: "Duradel, Nieve, Chaeldar can assign TzHaar; chance to fight TzTok-Jad" },
  { name: "Duly Noted", cost: 200, category: "unlock", description: "Mithril dragons drop noted mithril bars on assignment" },
  { name: "Watch the Birdie", cost: 80, category: "unlock", description: "Konar, Duradel, Nieve, Chaeldar, Krystilia can assign Aviansie" },
  { name: "Basilocked", cost: 80, category: "unlock", description: "Konar, Duradel, Nieve can assign Basilisks" },
  { name: "Actual Vampyre Slayer", cost: 80, category: "unlock", description: "Konar, Duradel, Nieve, Chaeldar can assign Vampyres" },
  { name: "Lured In", cost: 80, category: "unlock", description: "Nieve and Duradel can assign Aquanites" },
  { name: "Wings Spread", cost: 80, category: "unlock", description: "Nieve and Duradel can assign Gryphons" },
  { name: "Reptile Got Ripped", cost: 75, category: "unlock", description: "Konar, Duradel, Nieve, Chaeldar can assign Lizardmen" },
  { name: "Warped Reality", cost: 60, category: "unlock", description: "Konar, Duradel, Nieve, Chaeldar can assign Warped creatures" },
  { name: "Seeing Red", cost: 50, category: "unlock", description: "Konar, Duradel, Nieve can assign Red dragons" },
  { name: "Double Trouble", cost: 500, category: "unlock", description: "Dusk and Dawn each count as separate kills toward Grotesque Guardian task" },
  { name: "Stop the Wyvern", cost: 500, category: "unlock", description: "Remove Fossil Island Wyverns from assignment pool (no block slot)" },
  { name: "Slug Salter", cost: 10, category: "unlock", description: "Auto-finish rock slugs with bag of salt in inventory" },
  { name: "Reptile Freezer", cost: 10, category: "unlock", description: "Auto-finish desert lizards with ice cooler in inventory" },
  { name: "I Wildy More Slayer", cost: 0, category: "unlock", description: "Krystilia can assign Jellies, Dust Devils, Nechryaels, Abyssal Demons" },

  // Extensions
  { name: "Augment my Abbies", cost: 100, category: "extend", description: "Abyssal demons: 200–250" },
  { name: "Nechs Please", cost: 100, category: "extend", description: "Nechryael: 200–250" },
  { name: "Get Smashed", cost: 100, category: "extend", description: "Gargoyles: 200–250" },
  { name: "To Dust You Shall Return", cost: 100, category: "extend", description: "Dust devils: 200–250" },
  { name: "Greater Challenge", cost: 100, category: "extend", description: "Greater demons: 200–250" },
  { name: "It's Dark in Here", cost: 100, category: "extend", description: "Black demons: 200–250" },
  { name: "Smell Ya Later", cost: 100, category: "extend", description: "Aberrant spectres: 200–250" },
  { name: "Horrorific", cost: 100, category: "extend", description: "Cave horrors: 200–250" },
  { name: "Krack On", cost: 100, category: "extend", description: "Cave kraken: 150–200" },
  { name: "Ankou Very Much", cost: 100, category: "extend", description: "Ankous: 91–150" },
  { name: "Suq-a-nother One", cost: 100, category: "extend", description: "Suqahs: 186–250" },
  { name: "Need More Darkness", cost: 100, category: "extend", description: "Dark beasts: 110–135" },
  { name: "Spiritual Fervour", cost: 100, category: "extend", description: "Spiritual creatures: 181–250" },
  { name: "Birds of a Feather", cost: 100, category: "extend", description: "Aviansie: 200–250" },
  { name: "Bleed Me Dry", cost: 75, category: "extend", description: "Bloodveld: 200–250" },
  { name: "Wyver-nother One", cost: 100, category: "extend", description: "Skeletal Wyverns: 50–75" },
  { name: "Wyver-nother Two", cost: 100, category: "extend", description: "Fossil Island Wyverns: 55–75" },
  { name: "Basilonger", cost: 100, category: "extend", description: "Basilisks: 200–250" },
  { name: "More at Stake", cost: 100, category: "extend", description: "Vampyres: 200–250" },
  { name: "Revenenenenenants", cost: 100, category: "extend", description: "Revenants: 100–150" },
  { name: "More eyes than sense", cost: 150, category: "extend", description: "Araxytes: 200–250" },
  { name: "Un-restraining Order", cost: 100, category: "extend", description: "Custodian stalkers: 200–250" },
  { name: "Let's Stay All Aquanite", cost: 100, category: "extend", description: "Aquanites: 150–200" },
  { name: "Can of Wyrms", cost: 100, category: "extend", description: "Wyrms: 200–250" },
  { name: "Gryphon and on", cost: 50, category: "extend", description: "Gryphons: +80 to base amount" },
  { name: "Pedal to the Metals", cost: 200, category: "extend", description: "Metal dragons: 150–200" },
  { name: "Get Scabaright on It", cost: 50, category: "extend", description: "Scabarites: 130–170" },
  { name: "Fire & Darkness", cost: 50, category: "extend", description: "Black dragons: 40–60" },

  // Purchases
  { name: "Herb sack", cost: 750, category: "buy", description: "Stores up to 30 of each grimy herb (58 Herblore)" },
  { name: "Rune pouch", cost: 750, category: "buy", description: "Stores 16,000 of 3 rune types" },
  { name: "Slayer ring (8)", cost: 75, category: "buy", description: "Ring with teleports to Slayer dungeons (75 Crafting + Ring Bling)" },
  { name: "Broad bolts (x250)", cost: 35, category: "buy", description: "For Turoths/Kurask (55 Slayer, 61 Ranged)" },
  { name: "Broad arrows (x250)", cost: 35, category: "buy", description: "For Turoths/Kurask (55 Slayer, 50 Ranged)" },
  { name: "Looting bag", cost: 10, category: "buy", description: "Stores tradeable items in Wilderness/PvP areas" },

  // Cosmetics (Slayer helm recolours)
  { name: "King Black Bonnet", cost: 1000, category: "cosmetic", description: "Black recolour — requires KBD head" },
  { name: "Kalphite Khat", cost: 1000, category: "cosmetic", description: "Green recolour — requires KQ head" },
  { name: "Unholy Helmet", cost: 1000, category: "cosmetic", description: "Red recolour — requires Abyssal Demon head" },
  { name: "Dark Mantle", cost: 1000, category: "cosmetic", description: "Purple recolour — requires Dark Claw" },
  { name: "Undead Head", cost: 1000, category: "cosmetic", description: "Turquoise recolour — requires Vorkath's head" },
  { name: "Use More Head", cost: 1000, category: "cosmetic", description: "Hydra theme — requires Alchemical Hydra head" },
  { name: "Eye see you", cost: 1000, category: "cosmetic", description: "Araxxor theme — requires Araxyte head" },
  { name: "Twisted Vision", cost: 1000, category: "cosmetic", description: "Great Olm theme — requires Twisted Horns" },
  { name: "Absolutely Slayin'", cost: 1000, category: "cosmetic", description: "Skillcape theme — requires 99 Slayer" },
];

export const SLAYER_STREAK_MULTIPLIERS = [
  { streak: "10th", multiplier: 5 },
  { streak: "50th", multiplier: 15 },
  { streak: "100th", multiplier: 25 },
  { streak: "250th", multiplier: 35 },
  { streak: "1,000th", multiplier: 50 },
] as const;

export interface SlayerBlockRecommendation {
  monster: string;
  reason: string;
}

export const RECOMMENDED_BLOCKS: Record<string, SlayerBlockRecommendation[]> = {
  "Duradel": [
    { monster: "Metal dragons", reason: "High weight (14), slow kills, low profit" },
    { monster: "Black demons", reason: "High weight (8), tedious unless doing Demonic Gorillas" },
    { monster: "Greater demons", reason: "High weight (9), slow XP unless doing K'ril" },
    { monster: "Hellhounds", reason: "High weight (10), no drops without ring of wealth (i)" },
    { monster: "Fire giants", reason: "Weight 7, mediocre XP and loot" },
    { monster: "Suqah", reason: "Weight 8, far from teleports, annoying mechanics" },
  ],
  "Nieve / Steve": [
    { monster: "Metal dragons", reason: "High weight (12), slow kills" },
    { monster: "Black demons", reason: "High weight (9), tedious without Demonic Gorillas" },
    { monster: "Fire giants", reason: "High weight (9), mediocre returns" },
    { monster: "Kalphite", reason: "High weight (9), only good if doing KQ" },
    { monster: "Hellhounds", reason: "Weight 8, no drops" },
    { monster: "Spiritual creatures", reason: "Weight 6, slow and spread out" },
  ],
  "Konar": [
    { monster: "Metal dragons", reason: "Highest weight (15), very slow in assigned locations" },
    { monster: "Black demons", reason: "Weight 9, location restriction makes them worse" },
    { monster: "Fire giants", reason: "Weight 9, Konar locations are inconvenient" },
    { monster: "Bloodveld", reason: "Weight 9, location-locked makes them tedious" },
    { monster: "Kalphite", reason: "Weight 9, slow in assigned areas" },
    { monster: "Drakes", reason: "Weight 10, slow kills for the amount assigned" },
  ],
  "Krystilia": [
    { monster: "Greater demons", reason: "High weight (8), dangerous in Wilderness" },
    { monster: "Hellhounds", reason: "Weight 7, no drops, PvP risk" },
    { monster: "Aviansies", reason: "Weight 7, hard to reach safely in Wilderness" },
    { monster: "Fire giants", reason: "Weight 7, PvP hotspot" },
    { monster: "Ice warriors", reason: "Weight 7, low value" },
    { monster: "Scorpions", reason: "Weight 6, very low XP" },
  ],
};

export interface SlayerStrategy {
  title: string;
  content: string;
}

export const BOOSTING_STRATEGIES: SlayerStrategy[] = [
  {
    title: "Turael Boosting (Best Points/Hr)",
    content: "Complete 9 fast tasks from Turael (0 points each — use cannon + expeditious bracelets), then take every 10th task from Konar or Duradel for 5x multiplied points. If near a 50th/100th milestone, count your streak and route the milestone task to your highest-level master. Turael tasks like Bats, Birds, and Cows can be done in under a minute each.",
  },
  {
    title: "Mazchna Boosting (Alternative)",
    content: "Do 49 tasks with Mazchna (6 pts each = 294 pts), then take every 50th from Konar (18 × 15 = 270 pts) for 564 pts per 50-task cycle. Slower than Turael boosting but builds streak naturally and is less click-intensive.",
  },
  {
    title: "When to Skip vs Block",
    content: "Skipping costs 30 points per task and should be used for tasks you dislike but have low weight (won't come up often). Blocking is for high-weight tasks you never want — it permanently removes them, making every future assignment better. You get 1 block slot per 50 Quest Points, up to 6 slots (plus 1 from Elite Lumbridge Diary).",
  },
  {
    title: "Master Selection",
    content: "Duradel (15 pts) — best task quality and XP/hr for high-level mains. Konar (18 pts) — best base points, bonus Brimstone Keys, but location-locked tasks. Krystilia (25 pts) — highest points but Wilderness-only with PvP risk, separate streak counter. Nieve (12 pts) — good balance of task quality and points, easier requirements than Duradel.",
  },
];

export const SLAYER_MASTERS: SlayerMaster[] = [
  {
    name: "Turael",
    combatRequired: 3,
    slayerRequired: 1,
    location: "Burthorpe",
    pointsPerTask: 0,
    tasks: [
      { monster: "Banshees", amount: "15-30", weight: 8, slayerLevel: 15, combatLevel: 3 },
      { monster: "Bats", amount: "15-30", weight: 7, slayerLevel: 1, combatLevel: 3 },
      { monster: "Bears", amount: "10-20", weight: 7, slayerLevel: 1, combatLevel: 3 },
      { monster: "Birds", amount: "15-30", weight: 6, slayerLevel: 1, combatLevel: 3 },
      { monster: "Cave bugs", amount: "10-30", weight: 8, slayerLevel: 7, combatLevel: 3 },
      { monster: "Cave crawlers", amount: "15-30", weight: 8, slayerLevel: 10, combatLevel: 3 },
      { monster: "Cave slime", amount: "10-20", weight: 8, slayerLevel: 17, combatLevel: 3 },
      { monster: "Cows", amount: "15-30", weight: 8, slayerLevel: 1, combatLevel: 3 },
      { monster: "Crawling Hands", amount: "15-30", weight: 8, slayerLevel: 5, combatLevel: 3 },
      { monster: "Dogs", amount: "15-30", weight: 7, slayerLevel: 1, combatLevel: 3 },
      { monster: "Dwarves", amount: "10-25", weight: 7, slayerLevel: 1, combatLevel: 3 },
      { monster: "Ghosts", amount: "15-30", weight: 7, slayerLevel: 1, combatLevel: 3 },
      { monster: "Goblins", amount: "15-30", weight: 7, slayerLevel: 1, combatLevel: 3 },
      { monster: "Icefiends", amount: "15-20", weight: 8, slayerLevel: 1, combatLevel: 3 },
      { monster: "Kalphite", amount: "15-30", weight: 6, slayerLevel: 1, combatLevel: 3 },
      { monster: "Lizards", amount: "15-30", weight: 8, slayerLevel: 22, combatLevel: 3 },
      { monster: "Minotaurs", amount: "10-20", weight: 7, slayerLevel: 1, combatLevel: 3 },
      { monster: "Monkeys", amount: "15-30", weight: 6, slayerLevel: 1, combatLevel: 3 },
      { monster: "Rats", amount: "15-30", weight: 7, slayerLevel: 1, combatLevel: 3 },
      { monster: "Scorpions", amount: "15-30", weight: 7, slayerLevel: 1, combatLevel: 3 },
      { monster: "Skeletons", amount: "15-30", weight: 7, slayerLevel: 1, combatLevel: 3 },
      { monster: "Spiders", amount: "15-30", weight: 6, slayerLevel: 1, combatLevel: 3 },
      { monster: "Wolves", amount: "15-30", weight: 7, slayerLevel: 1, combatLevel: 3 },
      { monster: "Zombies", amount: "15-30", weight: 7, slayerLevel: 1, combatLevel: 3 },
    ],
  },
  {
    name: "Konar",
    combatRequired: 75,
    slayerRequired: 1,
    location: "Mount Karuulm",
    pointsPerTask: 18,
    tasks: [
      { monster: "Aberrant spectres", amount: "120-170", weight: 6, slayerLevel: 60, combatLevel: 75 },
      { monster: "Abyssal demons", amount: "120-170", weight: 9, slayerLevel: 85, combatLevel: 75 },
      { monster: "Ankou", amount: "50", weight: 5, slayerLevel: 1, combatLevel: 75 },
      { monster: "Aviansies", amount: "120-170", weight: 6, slayerLevel: 1, combatLevel: 75 },
      { monster: "Basilisks", amount: "110-170", weight: 5, slayerLevel: 40, combatLevel: 75 },
      { monster: "Black demons", amount: "120-170", weight: 9, slayerLevel: 1, combatLevel: 75 },
      { monster: "Black dragons", amount: "10-15", weight: 6, slayerLevel: 1, combatLevel: 75 },
      { monster: "Bloodveld", amount: "120-170", weight: 9, slayerLevel: 50, combatLevel: 75 },
      { monster: "Blue dragons", amount: "120-170", weight: 4, slayerLevel: 1, combatLevel: 75 },
      { monster: "Bosses", amount: "3-35", weight: 8, slayerLevel: 1, combatLevel: 75 },
      { monster: "Brine rats", amount: "120-170", weight: 2, slayerLevel: 47, combatLevel: 75 },
      { monster: "Cave kraken", amount: "80-100", weight: 9, slayerLevel: 87, combatLevel: 75 },
      { monster: "Dagannoth", amount: "120-170", weight: 8, slayerLevel: 1, combatLevel: 75 },
      { monster: "Dark beasts", amount: "10-15", weight: 5, slayerLevel: 90, combatLevel: 75 },
      { monster: "Drakes", amount: "75-140", weight: 10, slayerLevel: 84, combatLevel: 75 },
      { monster: "Dust devils", amount: "120-170", weight: 6, slayerLevel: 65, combatLevel: 75 },
      { monster: "Fire giants", amount: "120-170", weight: 9, slayerLevel: 1, combatLevel: 75 },
      { monster: "Fossil Island wyverns", amount: "15-30", weight: 5, slayerLevel: 66, combatLevel: 75 },
      { monster: "Gargoyles", amount: "120-170", weight: 6, slayerLevel: 75, combatLevel: 75 },
      { monster: "Greater demons", amount: "120-170", weight: 7, slayerLevel: 1, combatLevel: 75 },
      { monster: "Hellhounds", amount: "120-170", weight: 8, slayerLevel: 1, combatLevel: 75 },
      { monster: "Hydras", amount: "125-190", weight: 10, slayerLevel: 95, combatLevel: 75 },
      { monster: "Jellies", amount: "120-170", weight: 6, slayerLevel: 52, combatLevel: 75 },
      { monster: "Kalphite", amount: "120-170", weight: 9, slayerLevel: 1, combatLevel: 75 },
      { monster: "Kurask", amount: "120-170", weight: 3, slayerLevel: 70, combatLevel: 75 },
      { monster: "Lesser Nagua", amount: "55-120", weight: 2, slayerLevel: 1, combatLevel: 75 },
      { monster: "Lizardmen", amount: "90-110", weight: 8, slayerLevel: 1, combatLevel: 75 },
      { monster: "Metal dragons", amount: "30-40", weight: 15, slayerLevel: 1, combatLevel: 75 },
      { monster: "Mutated Zygomites", amount: "10-25", weight: 2, slayerLevel: 57, combatLevel: 75 },
      { monster: "Nechryael", amount: "110", weight: 7, slayerLevel: 80, combatLevel: 75 },
      { monster: "Red dragons", amount: "30-50", weight: 5, slayerLevel: 1, combatLevel: 75 },
      { monster: "Skeletal wyverns", amount: "5-12", weight: 5, slayerLevel: 72, combatLevel: 75 },
      { monster: "Smoke devils", amount: "120-170", weight: 7, slayerLevel: 93, combatLevel: 75 },
      { monster: "Trolls", amount: "120-170", weight: 6, slayerLevel: 1, combatLevel: 75 },
      { monster: "Turoth", amount: "120-170", weight: 3, slayerLevel: 55, combatLevel: 75 },
      { monster: "Vampyres", amount: "100-160", weight: 4, slayerLevel: 1, combatLevel: 75 },
      { monster: "Warped creatures", amount: "110-170", weight: 4, slayerLevel: 1, combatLevel: 75 },
      { monster: "Waterfiends", amount: "120-170", weight: 2, slayerLevel: 1, combatLevel: 75 },
      { monster: "Wyrms", amount: "125-190", weight: 10, slayerLevel: 62, combatLevel: 75 },
    ],
  },
  {
    name: "Krystilia",
    combatRequired: 3,
    slayerRequired: 1,
    location: "Edgeville",
    pointsPerTask: 25,
    tasks: [
      { monster: "Abyssal demons", amount: "75-125", weight: 5, slayerLevel: 85, combatLevel: 3 },
      { monster: "Ankou", amount: "75-125", weight: 6, slayerLevel: 1, combatLevel: 3 },
      { monster: "Aviansies", amount: "75-125", weight: 7, slayerLevel: 1, combatLevel: 3 },
      { monster: "Bandits", amount: "75-125", weight: 4, slayerLevel: 1, combatLevel: 3 },
      { monster: "Bears", amount: "65-100", weight: 6, slayerLevel: 1, combatLevel: 3 },
      { monster: "Black demons", amount: "100-150", weight: 7, slayerLevel: 1, combatLevel: 3 },
      { monster: "Black dragons", amount: "8-16", weight: 4, slayerLevel: 1, combatLevel: 3 },
      { monster: "Black Knights", amount: "75-125", weight: 3, slayerLevel: 1, combatLevel: 3 },
      { monster: "Bloodveld", amount: "70-110", weight: 4, slayerLevel: 50, combatLevel: 3 },
      { monster: "Chaos druids", amount: "50-90", weight: 5, slayerLevel: 1, combatLevel: 3 },
      { monster: "Dark warriors", amount: "75-125", weight: 4, slayerLevel: 1, combatLevel: 3 },
      { monster: "Dust devils", amount: "75-125", weight: 5, slayerLevel: 65, combatLevel: 3 },
      { monster: "Earth warriors", amount: "75-125", weight: 6, slayerLevel: 1, combatLevel: 3 },
      { monster: "Ents", amount: "35-60", weight: 5, slayerLevel: 1, combatLevel: 3 },
      { monster: "Fire giants", amount: "75-125", weight: 7, slayerLevel: 1, combatLevel: 3 },
      { monster: "Greater demons", amount: "100-150", weight: 8, slayerLevel: 1, combatLevel: 3 },
      { monster: "Green dragons", amount: "65-100", weight: 4, slayerLevel: 1, combatLevel: 3 },
      { monster: "Hellhounds", amount: "75-125", weight: 7, slayerLevel: 1, combatLevel: 3 },
      { monster: "Hill Giants", amount: "75-125", weight: 3, slayerLevel: 1, combatLevel: 3 },
      { monster: "Ice giants", amount: "100-150", weight: 6, slayerLevel: 1, combatLevel: 3 },
      { monster: "Ice warriors", amount: "100-150", weight: 7, slayerLevel: 1, combatLevel: 3 },
      { monster: "Jellies", amount: "100-150", weight: 5, slayerLevel: 52, combatLevel: 3 },
      { monster: "Lava dragons", amount: "35-60", weight: 3, slayerLevel: 1, combatLevel: 3 },
      { monster: "Lesser demons", amount: "80-120", weight: 6, slayerLevel: 1, combatLevel: 3 },
      { monster: "Magic axes", amount: "75-125", weight: 7, slayerLevel: 1, combatLevel: 3 },
      { monster: "Mammoths", amount: "75-125", weight: 6, slayerLevel: 1, combatLevel: 3 },
      { monster: "Moss giants", amount: "100-150", weight: 4, slayerLevel: 1, combatLevel: 3 },
      { monster: "Nechryael", amount: "75-125", weight: 5, slayerLevel: 80, combatLevel: 3 },
      { monster: "Pirates", amount: "62-75", weight: 3, slayerLevel: 1, combatLevel: 3 },
      { monster: "Revenants", amount: "40-100", weight: 5, slayerLevel: 1, combatLevel: 3 },
      { monster: "Rogues", amount: "75-125", weight: 5, slayerLevel: 1, combatLevel: 3 },
      { monster: "Scorpions", amount: "65-100", weight: 6, slayerLevel: 1, combatLevel: 3 },
      { monster: "Skeletons", amount: "65-100", weight: 5, slayerLevel: 1, combatLevel: 3 },
      { monster: "Spiders", amount: "65-100", weight: 6, slayerLevel: 1, combatLevel: 3 },
      { monster: "Spiritual creatures", amount: "100-150", weight: 6, slayerLevel: 63, combatLevel: 3 },
      { monster: "Zombies", amount: "75-125", weight: 3, slayerLevel: 1, combatLevel: 3 },
      { monster: "Wilderness bosses", amount: "3-35", weight: 8, slayerLevel: 1, combatLevel: 3 },
    ],
  },
  {
    name: "Nieve / Steve",
    combatRequired: 85,
    slayerRequired: 1,
    location: "Stronghold Slayer Cave",
    pointsPerTask: 12,
    tasks: [
      { monster: "Aberrant spectres", amount: "120-185", weight: 6, slayerLevel: 60, combatLevel: 85 },
      { monster: "Abyssal demons", amount: "120-185", weight: 9, slayerLevel: 85, combatLevel: 85 },
      { monster: "Ankou", amount: "50-90", weight: 5, slayerLevel: 1, combatLevel: 85 },
      { monster: "Araxytes", amount: "40-60", weight: 8, slayerLevel: 92, combatLevel: 85 },
      { monster: "Aviansies", amount: "120-185", weight: 6, slayerLevel: 1, combatLevel: 85 },
      { monster: "Aquanites", amount: "40-60", weight: 5, slayerLevel: 78, combatLevel: 85 },
      { monster: "Basilisks", amount: "120-185", weight: 6, slayerLevel: 40, combatLevel: 85 },
      { monster: "Black demons", amount: "120-185", weight: 9, slayerLevel: 1, combatLevel: 85 },
      { monster: "Black dragons", amount: "10-20", weight: 6, slayerLevel: 1, combatLevel: 85 },
      { monster: "Bloodveld", amount: "120-185", weight: 9, slayerLevel: 50, combatLevel: 85 },
      { monster: "Blue dragons", amount: "120-185", weight: 4, slayerLevel: 1, combatLevel: 85 },
      { monster: "Bosses", amount: "3-35", weight: 8, slayerLevel: 1, combatLevel: 85 },
      { monster: "Brine rats", amount: "120-185", weight: 3, slayerLevel: 47, combatLevel: 85 },
      { monster: "Cave horrors", amount: "120-180", weight: 5, slayerLevel: 58, combatLevel: 85 },
      { monster: "Cave kraken", amount: "100-120", weight: 6, slayerLevel: 87, combatLevel: 85 },
      { monster: "Custodian stalker", amount: "110-170", weight: 8, slayerLevel: 1, combatLevel: 85 },
      { monster: "Dagannoth", amount: "120-185", weight: 8, slayerLevel: 1, combatLevel: 85 },
      { monster: "Dark beasts", amount: "10-20", weight: 5, slayerLevel: 90, combatLevel: 85 },
      { monster: "Drakes", amount: "30-95", weight: 7, slayerLevel: 84, combatLevel: 85 },
      { monster: "Dust devils", amount: "120-185", weight: 6, slayerLevel: 65, combatLevel: 85 },
      { monster: "Elves", amount: "60-90", weight: 4, slayerLevel: 1, combatLevel: 85 },
      { monster: "Fire giants", amount: "120-185", weight: 9, slayerLevel: 1, combatLevel: 85 },
      { monster: "Fossil Island wyverns", amount: "5-25", weight: 5, slayerLevel: 66, combatLevel: 85 },
      { monster: "Frost dragons", amount: "60-100", weight: 5, slayerLevel: 1, combatLevel: 85 },
      { monster: "Gargoyles", amount: "120-185", weight: 6, slayerLevel: 75, combatLevel: 85 },
      { monster: "Greater demons", amount: "120-185", weight: 7, slayerLevel: 1, combatLevel: 85 },
      { monster: "Gryphons", amount: "110-170", weight: 7, slayerLevel: 1, combatLevel: 85 },
      { monster: "Hellhounds", amount: "120-185", weight: 8, slayerLevel: 1, combatLevel: 85 },
      { monster: "Kalphite", amount: "120-185", weight: 9, slayerLevel: 1, combatLevel: 85 },
      { monster: "Kurask", amount: "120-185", weight: 3, slayerLevel: 70, combatLevel: 85 },
      { monster: "Lizardmen", amount: "90-120", weight: 8, slayerLevel: 1, combatLevel: 85 },
      { monster: "Metal dragons", amount: "30-40", weight: 12, slayerLevel: 1, combatLevel: 85 },
      { monster: "Mutated Zygomites", amount: "10-25", weight: 2, slayerLevel: 57, combatLevel: 85 },
      { monster: "Nechryael", amount: "110-170", weight: 7, slayerLevel: 80, combatLevel: 85 },
      { monster: "Red dragons", amount: "30-80", weight: 5, slayerLevel: 1, combatLevel: 85 },
      { monster: "Scabarites", amount: "30-60", weight: 4, slayerLevel: 1, combatLevel: 85 },
      { monster: "Skeletal wyverns", amount: "5-15", weight: 5, slayerLevel: 72, combatLevel: 85 },
      { monster: "Smoke devils", amount: "120-185", weight: 7, slayerLevel: 93, combatLevel: 85 },
      { monster: "Spiritual creatures", amount: "120-185", weight: 6, slayerLevel: 63, combatLevel: 85 },
      { monster: "Suqah", amount: "120-185", weight: 8, slayerLevel: 1, combatLevel: 85 },
      { monster: "Trolls", amount: "120-185", weight: 6, slayerLevel: 1, combatLevel: 85 },
      { monster: "Turoth", amount: "120-185", weight: 3, slayerLevel: 55, combatLevel: 85 },
      { monster: "TzHaar", amount: "110-180", weight: 10, slayerLevel: 1, combatLevel: 85 },
      { monster: "Vampyres", amount: "110-170", weight: 6, slayerLevel: 1, combatLevel: 85 },
      { monster: "Warped creatures", amount: "120-185", weight: 6, slayerLevel: 1, combatLevel: 85 },
      { monster: "Wyrms", amount: "80-145", weight: 7, slayerLevel: 62, combatLevel: 85 },
    ],
  },
  {
    name: "Duradel",
    combatRequired: 100,
    slayerRequired: 50,
    location: "Shilo Village",
    pointsPerTask: 15,
    tasks: [
      { monster: "Aberrant spectres", amount: "130-200", weight: 7, slayerLevel: 60, combatLevel: 100 },
      { monster: "Abyssal demons", amount: "130-200", weight: 12, slayerLevel: 85, combatLevel: 100 },
      { monster: "Ankou", amount: "50-80", weight: 5, slayerLevel: 1, combatLevel: 100 },
      { monster: "Aquanites", amount: "30-50", weight: 5, slayerLevel: 78, combatLevel: 100 },
      { monster: "Araxytes", amount: "60-80", weight: 10, slayerLevel: 92, combatLevel: 100 },
      { monster: "Aviansies", amount: "120-200", weight: 8, slayerLevel: 1, combatLevel: 100 },
      { monster: "Basilisks", amount: "130-200", weight: 7, slayerLevel: 40, combatLevel: 100 },
      { monster: "Black demons", amount: "130-200", weight: 8, slayerLevel: 1, combatLevel: 100 },
      { monster: "Black dragons", amount: "10-20", weight: 9, slayerLevel: 1, combatLevel: 100 },
      { monster: "Bloodveld", amount: "130-200", weight: 8, slayerLevel: 50, combatLevel: 100 },
      { monster: "Blue dragons", amount: "110-170", weight: 4, slayerLevel: 1, combatLevel: 100 },
      { monster: "Bosses", amount: "3-35", weight: 12, slayerLevel: 1, combatLevel: 100 },
      { monster: "Cave horrors", amount: "130-200", weight: 4, slayerLevel: 58, combatLevel: 100 },
      { monster: "Cave kraken", amount: "100-120", weight: 9, slayerLevel: 87, combatLevel: 100 },
      { monster: "Dagannoth", amount: "130-200", weight: 9, slayerLevel: 1, combatLevel: 100 },
      { monster: "Dark beasts", amount: "10-20", weight: 11, slayerLevel: 90, combatLevel: 100 },
      { monster: "Drakes", amount: "50-110", weight: 8, slayerLevel: 84, combatLevel: 100 },
      { monster: "Dust devils", amount: "130-200", weight: 5, slayerLevel: 65, combatLevel: 100 },
      { monster: "Elves", amount: "110-170", weight: 4, slayerLevel: 1, combatLevel: 100 },
      { monster: "Fire giants", amount: "130-200", weight: 7, slayerLevel: 1, combatLevel: 100 },
      { monster: "Fossil Island wyverns", amount: "20-50", weight: 7, slayerLevel: 66, combatLevel: 100 },
      { monster: "Frost dragons", amount: "70-120", weight: 5, slayerLevel: 1, combatLevel: 100 },
      { monster: "Gargoyles", amount: "130-200", weight: 8, slayerLevel: 75, combatLevel: 100 },
      { monster: "Greater demons", amount: "130-200", weight: 9, slayerLevel: 1, combatLevel: 100 },
      { monster: "Gryphons", amount: "100-210", weight: 7, slayerLevel: 1, combatLevel: 100 },
      { monster: "Hellhounds", amount: "130-200", weight: 10, slayerLevel: 1, combatLevel: 100 },
      { monster: "Kalphite", amount: "130-200", weight: 9, slayerLevel: 1, combatLevel: 100 },
      { monster: "Kurask", amount: "130-200", weight: 4, slayerLevel: 70, combatLevel: 100 },
      { monster: "Lizardmen", amount: "130-210", weight: 10, slayerLevel: 1, combatLevel: 100 },
      { monster: "Metal dragons", amount: "35-45", weight: 14, slayerLevel: 1, combatLevel: 100 },
      { monster: "Mutated Zygomites", amount: "20-30", weight: 2, slayerLevel: 57, combatLevel: 100 },
      { monster: "Nechryael", amount: "130-200", weight: 9, slayerLevel: 80, combatLevel: 100 },
      { monster: "Red dragons", amount: "30-65", weight: 8, slayerLevel: 1, combatLevel: 100 },
      { monster: "Skeletal wyverns", amount: "20-40", weight: 7, slayerLevel: 72, combatLevel: 100 },
      { monster: "Smoke devils", amount: "130-200", weight: 9, slayerLevel: 93, combatLevel: 100 },
      { monster: "Spiritual creatures", amount: "130-200", weight: 7, slayerLevel: 63, combatLevel: 100 },
      { monster: "Suqah", amount: "60-90", weight: 8, slayerLevel: 1, combatLevel: 100 },
      { monster: "Trolls", amount: "130-200", weight: 6, slayerLevel: 1, combatLevel: 100 },
      { monster: "TzHaar", amount: "130-199", weight: 10, slayerLevel: 1, combatLevel: 100 },
      { monster: "Vampyres", amount: "100-210", weight: 8, slayerLevel: 1, combatLevel: 100 },
      { monster: "Warped creatures", amount: "130-200", weight: 8, slayerLevel: 1, combatLevel: 100 },
      { monster: "Waterfiends", amount: "130-200", weight: 2, slayerLevel: 1, combatLevel: 100 },
      { monster: "Wyrms", amount: "100-160", weight: 8, slayerLevel: 62, combatLevel: 100 },
    ],
  },
];

// Apply requiredUnlock to tasks that need a reward purchase
const TASK_UNLOCK_MAP: Record<string, string> = {
  "Bosses": "Like a Boss",
  "Wilderness bosses": "Like a Boss",
  "Red dragons": "Seeing Red",
  "Aviansies": "Watch the Birdie",
  "Basilisks": "Basilocked",
  "Vampyres": "Actual Vampyre Slayer",
  "Lizardmen": "Reptile Got Ripped",
  "Warped creatures": "Warped Reality",
  "TzHaar": "Hot Stuff",
  "Aquanites": "Lured In",
  "Gryphons": "Wings Spread",
};

for (const master of SLAYER_MASTERS) {
  if (master.name === "Turael") continue;
  for (const task of master.tasks) {
    const unlock = TASK_UNLOCK_MAP[task.monster];
    if (unlock) task.requiredUnlock = unlock;
  }
}
