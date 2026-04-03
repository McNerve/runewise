export type TrainingIntensity = "afk" | "low" | "medium" | "high";

export interface TrainingMethod {
  name: string;
  xp: number;
  xpPerHour?: number;
  levelReq?: number;
  itemId?: number;
  itemName?: string;
  itemsPerAction?: number;
  intensity?: TrainingIntensity;
  ironmanViable?: boolean;
  members?: boolean;
}

export const TRAINING_METHODS: Record<string, TrainingMethod[]> = {
  Attack: [
    { name: "Sand Crabs", xp: 40, xpPerHour: 30_000, levelReq: 1, intensity: "afk", ironmanViable: true },
    { name: "Ammonite Crabs", xp: 52, xpPerHour: 45_000, levelReq: 1, intensity: "afk", ironmanViable: true },
    { name: "Experiments", xp: 25, xpPerHour: 20_000, levelReq: 1, intensity: "afk", ironmanViable: true, members: false },
    { name: "Nightmare Zone", xp: 80, xpPerHour: 80_000, levelReq: 70, intensity: "afk", ironmanViable: true },
    { name: "Slayer tasks", xp: 45, xpPerHour: 40_000, levelReq: 1, intensity: "medium", ironmanViable: true },
    { name: "Pest Control", xp: 35, xpPerHour: 35_000, levelReq: 40, intensity: "low", ironmanViable: true },
    { name: "Soul Wars", xp: 30, xpPerHour: 25_000, levelReq: 40, intensity: "low", ironmanViable: true },
  ],
  Strength: [
    { name: "Sand Crabs", xp: 40, xpPerHour: 30_000, levelReq: 1, intensity: "afk", ironmanViable: true },
    { name: "Ammonite Crabs", xp: 52, xpPerHour: 45_000, levelReq: 1, intensity: "afk", ironmanViable: true },
    { name: "Experiments", xp: 25, xpPerHour: 20_000, levelReq: 1, intensity: "afk", ironmanViable: true, members: false },
    { name: "Nightmare Zone", xp: 80, xpPerHour: 80_000, levelReq: 70, intensity: "afk", ironmanViable: true },
    { name: "Slayer tasks", xp: 45, xpPerHour: 40_000, levelReq: 1, intensity: "medium", ironmanViable: true },
    { name: "Pest Control", xp: 35, xpPerHour: 35_000, levelReq: 40, intensity: "low", ironmanViable: true },
  ],
  Defence: [
    { name: "Sand Crabs", xp: 40, xpPerHour: 30_000, levelReq: 1, intensity: "afk", ironmanViable: true },
    { name: "Ammonite Crabs", xp: 52, xpPerHour: 45_000, levelReq: 1, intensity: "afk", ironmanViable: true },
    { name: "Experiments", xp: 25, xpPerHour: 20_000, levelReq: 1, intensity: "afk", ironmanViable: true, members: false },
    { name: "Nightmare Zone", xp: 80, xpPerHour: 80_000, levelReq: 70, intensity: "afk", ironmanViable: true },
    { name: "Slayer tasks", xp: 45, xpPerHour: 40_000, levelReq: 1, intensity: "medium", ironmanViable: true },
    { name: "Pest Control", xp: 35, xpPerHour: 35_000, levelReq: 40, intensity: "low", ironmanViable: true },
  ],
  Ranged: [
    { name: "Sand Crabs (MSB)", xp: 40, xpPerHour: 35_000, levelReq: 40, intensity: "afk", ironmanViable: true },
    { name: "Ammonite Crabs", xp: 52, xpPerHour: 45_000, levelReq: 1, intensity: "afk", ironmanViable: true },
    { name: "Chinchompas (MM2)", xp: 350, xpPerHour: 500_000, levelReq: 65, intensity: "high", ironmanViable: true },
    { name: "Chinchompas (pre-MM2)", xp: 200, xpPerHour: 200_000, levelReq: 65, intensity: "medium", ironmanViable: true },
    { name: "Slayer tasks", xp: 45, xpPerHour: 40_000, levelReq: 1, intensity: "medium", ironmanViable: true },
    { name: "Cannon + Slayer", xp: 80, xpPerHour: 70_000, levelReq: 1, intensity: "medium", ironmanViable: true },
    { name: "Toxic blowpipe", xp: 50, xpPerHour: 60_000, levelReq: 75, intensity: "medium", ironmanViable: true },
    { name: "Knives", xp: 30, xpPerHour: 25_000, levelReq: 1, intensity: "afk", ironmanViable: true, members: false },
    { name: "Darts", xp: 20, xpPerHour: 20_000, levelReq: 1, intensity: "afk", ironmanViable: true, members: false },
    { name: "Craw's bow (Wilderness)", xp: 60, xpPerHour: 65_000, levelReq: 60, intensity: "medium", ironmanViable: true },
  ],
  Prayer: [
    { name: "Big bones (Gilded altar)", xp: 52.5, xpPerHour: 200_000, levelReq: 1, itemId: 532, itemName: "Big bones", intensity: "low", ironmanViable: true },
    { name: "Dragon bones (Gilded altar)", xp: 252, xpPerHour: 600_000, levelReq: 1, itemId: 536, itemName: "Dragon bones", intensity: "low" },
    { name: "Dagannoth bones (Gilded altar)", xp: 437.5, xpPerHour: 800_000, levelReq: 1, itemId: 6729, itemName: "Dagannoth bones", intensity: "low" },
    { name: "Superior dragon bones (Gilded altar)", xp: 525, xpPerHour: 1_000_000, levelReq: 70, itemId: 22124, itemName: "Superior dragon bones", intensity: "low" },
    { name: "Ensouled dragon heads", xp: 1560, xpPerHour: 350_000, levelReq: 93, itemId: 13511, itemName: "Ensouled dragon head", intensity: "medium", ironmanViable: true },
    { name: "Ectofuntus (Dragon bones)", xp: 288, xpPerHour: 250_000, levelReq: 1, itemId: 536, itemName: "Dragon bones", intensity: "medium", ironmanViable: true },
    { name: "Chaos altar (Dragon bones)", xp: 252, xpPerHour: 500_000, levelReq: 1, itemId: 536, itemName: "Dragon bones", intensity: "high" },
    { name: "Wyvern bones (Gilded altar)", xp: 315, xpPerHour: 700_000, levelReq: 1, itemId: 6812, itemName: "Wyvern bones", intensity: "low" },
  ],
  Magic: [
    { name: "Splashing", xp: 11.5, xpPerHour: 12_000, levelReq: 1, intensity: "afk", ironmanViable: true },
    { name: "High Level Alchemy", xp: 65, xpPerHour: 78_000, levelReq: 55, intensity: "low", ironmanViable: true },
    { name: "Burst/Barrage (MM2)", xp: 170, xpPerHour: 250_000, levelReq: 70, intensity: "medium" },
    { name: "Burst/Barrage (Slayer)", xp: 150, xpPerHour: 200_000, levelReq: 70, intensity: "medium", ironmanViable: true },
    { name: "Enchant bolts", xp: 87, xpPerHour: 100_000, levelReq: 4, intensity: "low", ironmanViable: true },
    { name: "Tan Leather", xp: 81, xpPerHour: 130_000, levelReq: 78, intensity: "low" },
    { name: "Plank Make", xp: 90, xpPerHour: 140_000, levelReq: 86, intensity: "low", ironmanViable: true },
    { name: "String Jewellery", xp: 83, xpPerHour: 140_000, levelReq: 80, intensity: "low" },
    { name: "Surge spells", xp: 80, xpPerHour: 70_000, levelReq: 81, intensity: "medium", ironmanViable: true },
  ],
  Runecraft: [
    { name: "Guardians of the Rift", xp: 55, xpPerHour: 50_000, levelReq: 27, intensity: "medium", ironmanViable: true },
    { name: "Lava runes", xp: 26, xpPerHour: 70_000, levelReq: 23, intensity: "high" },
    { name: "Blood runes (true altar)", xp: 24, xpPerHour: 40_000, levelReq: 77, intensity: "low", ironmanViable: true },
    { name: "ZMI altar", xp: 40, xpPerHour: 55_000, levelReq: 1, intensity: "medium", ironmanViable: true },
    { name: "Abyss (Nature runes)", xp: 9, xpPerHour: 25_000, levelReq: 44, intensity: "medium", ironmanViable: true },
    { name: "Wrath runes", xp: 8, xpPerHour: 20_000, levelReq: 95, intensity: "medium", ironmanViable: true },
    { name: "Death runes (Abyss)", xp: 10, xpPerHour: 30_000, levelReq: 65, intensity: "medium", ironmanViable: true },
  ],
  Hitpoints: [
    { name: "Any combat (1/3 of combat XP)", xp: 13, xpPerHour: 15_000, levelReq: 1, intensity: "low", ironmanViable: true },
    { name: "Nightmare Zone", xp: 27, xpPerHour: 27_000, levelReq: 70, intensity: "afk", ironmanViable: true },
  ],
  Crafting: [
    { name: "Gold bracelets", xp: 25, xpPerHour: 60_000, levelReq: 7, itemId: 2357, itemName: "Gold bar", intensity: "low" },
    { name: "Green d'hide bodies", xp: 186, xpPerHour: 300_000, levelReq: 63, itemId: 1745, itemName: "Green dragon leather", intensity: "low" },
    { name: "Blue d'hide bodies", xp: 210, xpPerHour: 340_000, levelReq: 71, itemId: 2505, itemName: "Blue dragon leather", intensity: "low" },
    { name: "Black d'hide bodies", xp: 258, xpPerHour: 400_000, levelReq: 77, itemId: 2509, itemName: "Black dragon leather", intensity: "low" },
    { name: "Cutting gems", xp: 85, xpPerHour: 100_000, levelReq: 20, intensity: "low" },
  ],
  Mining: [
    { name: "Iron ore (power-mining)", xp: 35, xpPerHour: 55_000, levelReq: 15, intensity: "high" },
    { name: "3-tick granite", xp: 75, xpPerHour: 100_000, levelReq: 45, intensity: "high" },
    { name: "Motherlode Mine", xp: 60, xpPerHour: 45_000, levelReq: 30, intensity: "afk" },
    { name: "Gem rocks (Shilo)", xp: 65, xpPerHour: 55_000, levelReq: 40, intensity: "medium" },
    { name: "Volcanic Mine", xp: 95, xpPerHour: 85_000, levelReq: 50, intensity: "medium" },
    { name: "Amethyst", xp: 240, xpPerHour: 20_000, levelReq: 92, intensity: "afk" },
    { name: "Shooting Stars", xp: 60, xpPerHour: 25_000, levelReq: 10, intensity: "afk" },
  ],
  Smithing: [
    { name: "Blast Furnace (Steel bars)", xp: 17.5, xpPerHour: 100_000, levelReq: 30, itemId: 453, itemName: "Coal", intensity: "medium" },
    { name: "Gold bars (Gauntlets)", xp: 56.2, xpPerHour: 380_000, levelReq: 40, itemId: 444, itemName: "Gold ore", intensity: "medium" },
    { name: "Mithril platebodies", xp: 250, xpPerHour: 200_000, levelReq: 68, itemId: 2359, itemName: "Mithril bar", itemsPerAction: 5, intensity: "low" },
    { name: "Adamant platebodies", xp: 312.5, xpPerHour: 250_000, levelReq: 88, itemId: 2361, itemName: "Adamantite bar", itemsPerAction: 5, intensity: "low" },
    { name: "Rune platebodies", xp: 375, xpPerHour: 300_000, levelReq: 99, itemId: 2363, itemName: "Runite bar", itemsPerAction: 5, intensity: "low" },
  ],
  Fishing: [
    { name: "Fly fishing (Trout/Salmon)", xp: 50, xpPerHour: 40_000, levelReq: 20, intensity: "medium" },
    { name: "Barbarian fishing", xp: 70, xpPerHour: 65_000, levelReq: 48, intensity: "medium" },
    { name: "Tempoross", xp: 65, xpPerHour: 55_000, levelReq: 35, intensity: "medium" },
    { name: "Karambwan", xp: 50, xpPerHour: 30_000, levelReq: 65, intensity: "afk" },
    { name: "Minnows", xp: 26.5, xpPerHour: 40_000, levelReq: 82, intensity: "medium" },
    { name: "Anglerfish", xp: 120, xpPerHour: 35_000, levelReq: 82, intensity: "afk" },
  ],
  Cooking: [
    { name: "Wines", xp: 200, xpPerHour: 490_000, levelReq: 35, itemId: 1987, itemName: "Grapes", intensity: "low" },
    { name: "Lobsters", xp: 120, xpPerHour: 150_000, levelReq: 40, itemId: 379, itemName: "Raw lobster", intensity: "low" },
    { name: "Swordfish", xp: 140, xpPerHour: 175_000, levelReq: 45, itemId: 371, itemName: "Raw swordfish", intensity: "low" },
    { name: "Monkfish", xp: 150, xpPerHour: 200_000, levelReq: 62, itemId: 7944, itemName: "Raw monkfish", intensity: "low" },
    { name: "Sharks", xp: 210, xpPerHour: 270_000, levelReq: 80, itemId: 383, itemName: "Raw shark", intensity: "low" },
    { name: "Karambwan (1-tick)", xp: 190, xpPerHour: 490_000, levelReq: 30, itemId: 3142, itemName: "Raw karambwan", intensity: "high" },
    { name: "Anglerfish", xp: 230, xpPerHour: 300_000, levelReq: 84, itemId: 13439, itemName: "Raw anglerfish", intensity: "low" },
  ],
  Firemaking: [
    { name: "Maple logs", xp: 135, xpPerHour: 200_000, levelReq: 45, itemId: 1517, itemName: "Maple logs", intensity: "low" },
    { name: "Yew logs", xp: 202.5, xpPerHour: 260_000, levelReq: 60, itemId: 1515, itemName: "Yew logs", intensity: "low" },
    { name: "Magic logs", xp: 303.8, xpPerHour: 310_000, levelReq: 75, itemId: 1513, itemName: "Magic logs", intensity: "low" },
    { name: "Redwood logs", xp: 350, xpPerHour: 350_000, levelReq: 90, itemId: 19669, itemName: "Redwood logs", intensity: "low" },
    { name: "Wintertodt", xp: 100, xpPerHour: 300_000, levelReq: 50, intensity: "medium" },
  ],
  Woodcutting: [
    { name: "Willows", xp: 67.5, xpPerHour: 40_000, levelReq: 30, intensity: "afk" },
    { name: "Teak trees", xp: 85, xpPerHour: 85_000, levelReq: 35, intensity: "medium" },
    { name: "Sulliuscep mushrooms", xp: 127, xpPerHour: 90_000, levelReq: 65, intensity: "medium" },
    { name: "Magic trees", xp: 250, xpPerHour: 25_000, levelReq: 75, intensity: "afk" },
    { name: "Redwood trees", xp: 380, xpPerHour: 60_000, levelReq: 90, intensity: "afk" },
    { name: "Forestry events", xp: 90, xpPerHour: 60_000, levelReq: 1, intensity: "medium" },
  ],
  Agility: [
    { name: "Canifis course", xp: 240, xpPerHour: 19_000, levelReq: 40, intensity: "medium" },
    { name: "Seers' Village course", xp: 570, xpPerHour: 46_000, levelReq: 60, intensity: "medium" },
    { name: "Pollnivneach course", xp: 890, xpPerHour: 52_000, levelReq: 70, intensity: "high" },
    { name: "Rellekka course", xp: 780, xpPerHour: 55_000, levelReq: 80, intensity: "medium" },
    { name: "Hallowed Sepulchre", xp: 1200, xpPerHour: 70_000, levelReq: 52, intensity: "high" },
  ],
  Herblore: [
    { name: "Attack potions", xp: 25, xpPerHour: 75_000, levelReq: 3, itemId: 249, itemName: "Guam leaf", intensity: "low" },
    { name: "Prayer potions", xp: 117.5, xpPerHour: 350_000, levelReq: 38, itemId: 231, itemName: "Snape grass", intensity: "low" },
    { name: "Super restores", xp: 142.5, xpPerHour: 400_000, levelReq: 63, itemId: 3000, itemName: "Snapdragon", intensity: "low" },
    { name: "Ranging potions", xp: 162.5, xpPerHour: 425_000, levelReq: 72, itemId: 245, itemName: "Dwarf weed", intensity: "low" },
    { name: "Saradomin brews", xp: 180, xpPerHour: 450_000, levelReq: 81, itemId: 6693, itemName: "Toadflax", intensity: "low" },
    { name: "Super combat potions", xp: 150, xpPerHour: 420_000, levelReq: 90, itemId: 2436, itemName: "Super attack(4)", intensity: "low" },
  ],
  Thieving: [
    { name: "Fruit Stalls", xp: 28.5, xpPerHour: 40_000, levelReq: 25, intensity: "afk" },
    { name: "Blackjacking", xp: 160, xpPerHour: 230_000, levelReq: 45, intensity: "high" },
    { name: "Artefacts (Port Piscarilius)", xp: 40, xpPerHour: 100_000, levelReq: 49, intensity: "medium" },
    { name: "Knights of Ardougne", xp: 132.5, xpPerHour: 250_000, levelReq: 55, intensity: "medium" },
    { name: "Elves", xp: 353, xpPerHour: 280_000, levelReq: 85, intensity: "medium" },
  ],
  Fletching: [
    { name: "Maple longbows (u)", xp: 58.3, xpPerHour: 90_000, levelReq: 55, itemId: 1517, itemName: "Maple logs", intensity: "low" },
    { name: "Yew longbows (u)", xp: 75, xpPerHour: 110_000, levelReq: 70, itemId: 1515, itemName: "Yew logs", intensity: "low" },
    { name: "Magic longbows (u)", xp: 91.5, xpPerHour: 130_000, levelReq: 85, itemId: 1513, itemName: "Magic logs", intensity: "low" },
    { name: "Broad arrows", xp: 10, xpPerHour: 500_000, levelReq: 52, itemId: 11874, itemName: "Broad arrowheads", intensity: "afk" },
    { name: "Amethyst darts", xp: 21, xpPerHour: 700_000, levelReq: 90, itemId: 21350, itemName: "Amethyst dart tip", intensity: "low" },
    { name: "Dragon darts", xp: 25, xpPerHour: 800_000, levelReq: 95, itemId: 11232, itemName: "Dragon dart tip", intensity: "low" },
  ],
  Slayer: [
    { name: "Turael skipping", xp: 20, xpPerHour: 15_000, levelReq: 1, intensity: "medium" },
    { name: "Nieve/Steve tasks", xp: 50, xpPerHour: 35_000, levelReq: 1, intensity: "medium" },
    { name: "Duradel tasks (avg)", xp: 45, xpPerHour: 30_000, levelReq: 50, intensity: "medium" },
    { name: "Konar tasks (avg)", xp: 40, xpPerHour: 25_000, levelReq: 1, intensity: "medium" },
    { name: "Barrage tasks", xp: 170, xpPerHour: 100_000, levelReq: 70, intensity: "high" },
    { name: "Hydra/high-level tasks", xp: 200, xpPerHour: 45_000, levelReq: 85, intensity: "high" },
  ],
  Farming: [
    { name: "Ranarr herbs", xp: 27, xpPerHour: 50_000, levelReq: 32, itemId: 5295, itemName: "Ranarr seed", intensity: "afk" },
    { name: "Snapdragon herbs", xp: 98.5, xpPerHour: 100_000, levelReq: 62, itemId: 5300, itemName: "Snapdragon seed", intensity: "afk" },
    { name: "Magic trees", xp: 13768, xpPerHour: 35_000, levelReq: 75, itemId: 5316, itemName: "Magic seed", intensity: "afk" },
    { name: "Palm trees", xp: 10150, xpPerHour: 30_000, levelReq: 68, itemId: 5289, itemName: "Palm tree seed", intensity: "afk" },
    { name: "Tithe Farm", xp: 100, xpPerHour: 90_000, levelReq: 34, intensity: "high" },
  ],
  Construction: [
    { name: "Oak larders", xp: 480, xpPerHour: 250_000, levelReq: 33, itemId: 8778, itemName: "Oak plank", itemsPerAction: 8, intensity: "medium" },
    { name: "Oak dungeon doors", xp: 600, xpPerHour: 350_000, levelReq: 74, itemId: 8778, itemName: "Oak plank", itemsPerAction: 10, intensity: "high" },
    { name: "Mahogany tables", xp: 840, xpPerHour: 900_000, levelReq: 52, itemId: 8782, itemName: "Mahogany plank", itemsPerAction: 6, intensity: "high" },
    { name: "Mahogany benches", xp: 840, xpPerHour: 950_000, levelReq: 77, itemId: 8782, itemName: "Mahogany plank", itemsPerAction: 6, intensity: "high" },
    { name: "Mythical capes", xp: 370, xpPerHour: 580_000, levelReq: 47, itemId: 8778, itemName: "Teak plank", itemsPerAction: 3, intensity: "medium" },
  ],
  Hunter: [
    { name: "Bird houses", xp: 280, xpPerHour: 100_000, levelReq: 5, intensity: "afk" },
    { name: "Red chinchompas", xp: 265, xpPerHour: 150_000, levelReq: 63, intensity: "medium" },
    { name: "Black chinchompas", xp: 315, xpPerHour: 200_000, levelReq: 73, intensity: "high" },
    { name: "Herbiboar", xp: 1950, xpPerHour: 160_000, levelReq: 80, intensity: "medium" },
  ],
  Sailing: [
    { name: "Voyages", xp: 200, xpPerHour: 50_000, levelReq: 1, intensity: "medium" },
    { name: "Port activities", xp: 150, xpPerHour: 35_000, levelReq: 1, intensity: "low" },
    { name: "Island expeditions", xp: 300, xpPerHour: 60_000, levelReq: 30, intensity: "medium" },
  ],
};
