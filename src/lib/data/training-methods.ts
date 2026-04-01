export interface TrainingMethod {
  name: string;
  xp: number;
  xpPerHour?: number;
  levelReq?: number;
  itemId?: number; // Wiki item ID for GE price lookup
  itemName?: string;
  itemsPerAction?: number; // how many items consumed per action (default 1)
}

export const TRAINING_METHODS: Record<string, TrainingMethod[]> = {
  Attack: [
    { name: "Sand Crabs", xp: 40, xpPerHour: 30_000, levelReq: 1 },
    { name: "Ammonite Crabs", xp: 52, xpPerHour: 45_000, levelReq: 1 },
    { name: "Nightmare Zone", xp: 80, xpPerHour: 80_000, levelReq: 70 },
    { name: "Slayer tasks", xp: 45, xpPerHour: 40_000, levelReq: 1 },
  ],
  Strength: [
    { name: "Sand Crabs", xp: 40, xpPerHour: 30_000, levelReq: 1 },
    { name: "Ammonite Crabs", xp: 52, xpPerHour: 45_000, levelReq: 1 },
    { name: "Nightmare Zone", xp: 80, xpPerHour: 80_000, levelReq: 70 },
    { name: "Slayer tasks", xp: 45, xpPerHour: 40_000, levelReq: 1 },
  ],
  Defence: [
    { name: "Sand Crabs", xp: 40, xpPerHour: 30_000, levelReq: 1 },
    { name: "Ammonite Crabs", xp: 52, xpPerHour: 45_000, levelReq: 1 },
    { name: "Nightmare Zone", xp: 80, xpPerHour: 80_000, levelReq: 70 },
    { name: "Slayer tasks", xp: 45, xpPerHour: 40_000, levelReq: 1 },
  ],
  Ranged: [
    { name: "Sand Crabs (MSB)", xp: 40, xpPerHour: 35_000, levelReq: 40 },
    { name: "Chinchompas (MM2)", xp: 350, xpPerHour: 500_000, levelReq: 65 },
    { name: "Ammonite Crabs", xp: 52, xpPerHour: 45_000, levelReq: 1 },
    { name: "Slayer tasks", xp: 45, xpPerHour: 40_000, levelReq: 1 },
  ],
  Prayer: [
    { name: "Bones (Gilded altar)", xp: 252, xpPerHour: 300_000, levelReq: 1, itemId: 526, itemName: "Bones" },
    { name: "Dragon bones (Gilded altar)", xp: 252, xpPerHour: 600_000, levelReq: 1, itemId: 536, itemName: "Dragon bones" },
    { name: "Superior dragon bones (Gilded altar)", xp: 525, xpPerHour: 1_000_000, levelReq: 1, itemId: 22124, itemName: "Superior dragon bones" },
    { name: "Dagannoth bones (Gilded altar)", xp: 437.5, xpPerHour: 800_000, levelReq: 1, itemId: 6729, itemName: "Dagannoth bones" },
    { name: "Ensouled dragon heads", xp: 1560, xpPerHour: 350_000, levelReq: 93, itemId: 13511, itemName: "Ensouled dragon head" },
  ],
  Magic: [
    { name: "High Level Alchemy", xp: 65, xpPerHour: 78_000, levelReq: 55 },
    { name: "Burst/Barrage (MM2)", xp: 170, xpPerHour: 250_000, levelReq: 70 },
    { name: "Enchant bolts", xp: 87, xpPerHour: 100_000, levelReq: 4 },
    { name: "Tan Leather", xp: 81, xpPerHour: 130_000, levelReq: 78 },
  ],
  Runecraft: [
    { name: "Guardians of the Rift", xp: 55, xpPerHour: 50_000, levelReq: 27 },
    { name: "Lava runes", xp: 26, xpPerHour: 70_000, levelReq: 23 },
    { name: "Blood runes (true altar)", xp: 24, xpPerHour: 40_000, levelReq: 77 },
    { name: "ZMI altar", xp: 40, xpPerHour: 55_000, levelReq: 1 },
  ],
  Hitpoints: [
    { name: "Any combat (1/3 of combat XP)", xp: 13, xpPerHour: 15_000, levelReq: 1 },
    { name: "Nightmare Zone", xp: 27, xpPerHour: 27_000, levelReq: 70 },
  ],
  Crafting: [
    { name: "Gold bracelets", xp: 25, xpPerHour: 60_000, levelReq: 7, itemId: 2357, itemName: "Gold bar" },
    { name: "Green d'hide bodies", xp: 186, xpPerHour: 300_000, levelReq: 63, itemId: 1745, itemName: "Green dragon leather" },
    { name: "Blue d'hide bodies", xp: 210, xpPerHour: 340_000, levelReq: 71, itemId: 2505, itemName: "Blue dragon leather" },
    { name: "Black d'hide bodies", xp: 258, xpPerHour: 400_000, levelReq: 77, itemId: 2509, itemName: "Black dragon leather" },
    { name: "Cutting gems", xp: 85, xpPerHour: 100_000, levelReq: 20 },
  ],
  Mining: [
    { name: "Iron ore", xp: 35, xpPerHour: 55_000, levelReq: 15 },
    { name: "3-tick granite", xp: 75, xpPerHour: 100_000, levelReq: 45 },
    { name: "Motherlode Mine", xp: 60, xpPerHour: 45_000, levelReq: 30 },
    { name: "Volcanic Mine", xp: 95, xpPerHour: 85_000, levelReq: 50 },
    { name: "Shooting Stars", xp: 60, xpPerHour: 25_000, levelReq: 10 },
  ],
  Smithing: [
    { name: "Gold bars (Gauntlets)", xp: 56.2, xpPerHour: 380_000, levelReq: 40, itemId: 444, itemName: "Gold ore" },
    { name: "Mithril platebodies", xp: 250, xpPerHour: 200_000, levelReq: 68, itemId: 2359, itemName: "Mithril bar", itemsPerAction: 5 },
    { name: "Adamant platebodies", xp: 312.5, xpPerHour: 250_000, levelReq: 88, itemId: 2361, itemName: "Adamantite bar", itemsPerAction: 5 },
    { name: "Blast Furnace (Steel bars)", xp: 17.5, xpPerHour: 100_000, levelReq: 30, itemId: 453, itemName: "Coal" },
  ],
  Fishing: [
    { name: "Fly fishing (Trout/Salmon)", xp: 50, xpPerHour: 40_000, levelReq: 20 },
    { name: "Barbarian fishing", xp: 70, xpPerHour: 65_000, levelReq: 48 },
    { name: "Tempoross", xp: 65, xpPerHour: 55_000, levelReq: 35 },
    { name: "Minnows", xp: 26.1, xpPerHour: 40_000, levelReq: 82 },
    { name: "Karambwanji / Karambwan", xp: 105, xpPerHour: 45_000, levelReq: 65 },
  ],
  Cooking: [
    { name: "Lobsters", xp: 120, xpPerHour: 150_000, levelReq: 40, itemId: 379, itemName: "Raw lobster" },
    { name: "Swordfish", xp: 140, xpPerHour: 175_000, levelReq: 45, itemId: 371, itemName: "Raw swordfish" },
    { name: "Monkfish", xp: 150, xpPerHour: 200_000, levelReq: 62, itemId: 7944, itemName: "Raw monkfish" },
    { name: "Sharks", xp: 210, xpPerHour: 270_000, levelReq: 80, itemId: 383, itemName: "Raw shark" },
    { name: "Karambwan (1-tick)", xp: 190, xpPerHour: 490_000, levelReq: 30, itemId: 3142, itemName: "Raw karambwan" },
  ],
  Firemaking: [
    { name: "Maple logs", xp: 135, xpPerHour: 200_000, levelReq: 45, itemId: 1517, itemName: "Maple logs" },
    { name: "Yew logs", xp: 202.5, xpPerHour: 260_000, levelReq: 60, itemId: 1515, itemName: "Yew logs" },
    { name: "Magic logs", xp: 303.8, xpPerHour: 310_000, levelReq: 75, itemId: 1513, itemName: "Magic logs" },
    { name: "Redwood logs", xp: 350, xpPerHour: 350_000, levelReq: 90, itemId: 19669, itemName: "Redwood logs" },
    { name: "Wintertodt", xp: 100, xpPerHour: 300_000, levelReq: 50 },
  ],
  Woodcutting: [
    { name: "Willows", xp: 67.5, xpPerHour: 40_000, levelReq: 30 },
    { name: "Teak trees", xp: 85, xpPerHour: 85_000, levelReq: 35 },
    { name: "Sulliuscep mushrooms", xp: 127, xpPerHour: 90_000, levelReq: 65 },
    { name: "Redwood trees", xp: 380, xpPerHour: 60_000, levelReq: 90 },
    { name: "Forestry events", xp: 90, xpPerHour: 60_000, levelReq: 1 },
  ],
  Agility: [
    { name: "Canifis course", xp: 240, xpPerHour: 19_000, levelReq: 40 },
    { name: "Seers' Village course", xp: 570, xpPerHour: 46_000, levelReq: 60 },
    { name: "Pollnivneach course", xp: 890, xpPerHour: 52_000, levelReq: 70 },
    { name: "Rellekka course", xp: 780, xpPerHour: 55_000, levelReq: 80 },
    { name: "Hallowed Sepulchre", xp: 1200, xpPerHour: 70_000, levelReq: 52 },
  ],
  Herblore: [
    { name: "Prayer potions", xp: 117.5, xpPerHour: 350_000, levelReq: 38, itemId: 231, itemName: "Snape grass" },
    { name: "Super restores", xp: 142.5, xpPerHour: 400_000, levelReq: 63, itemId: 3000, itemName: "Snapdragon" },
    { name: "Ranging potions", xp: 162.5, xpPerHour: 425_000, levelReq: 72, itemId: 245, itemName: "Dwarf weed" },
    { name: "Saradomin brews", xp: 180, xpPerHour: 450_000, levelReq: 81, itemId: 6693, itemName: "Toadflax" },
  ],
  Thieving: [
    { name: "Fruit Stalls", xp: 28.5, xpPerHour: 40_000, levelReq: 25 },
    { name: "Blackjacking", xp: 160, xpPerHour: 230_000, levelReq: 45 },
    { name: "Artefacts (Port Piscarilius)", xp: 40, xpPerHour: 100_000, levelReq: 49 },
    { name: "Knights of Ardougne", xp: 132.5, xpPerHour: 250_000, levelReq: 55 },
    { name: "Elves", xp: 353, xpPerHour: 280_000, levelReq: 85 },
  ],
  Fletching: [
    { name: "Maple longbows (u)", xp: 58.3, xpPerHour: 90_000, levelReq: 55, itemId: 1517, itemName: "Maple logs" },
    { name: "Yew longbows (u)", xp: 75, xpPerHour: 110_000, levelReq: 70, itemId: 1515, itemName: "Yew logs" },
    { name: "Magic longbows (u)", xp: 91.5, xpPerHour: 130_000, levelReq: 85, itemId: 1513, itemName: "Magic logs" },
    { name: "Broad arrows", xp: 15, xpPerHour: 500_000, levelReq: 52, itemId: 11874, itemName: "Broad arrowheads" },
    { name: "Dragon darts", xp: 25, xpPerHour: 800_000, levelReq: 95, itemId: 11232, itemName: "Dragon dart tip" },
  ],
  Slayer: [
    { name: "Duradel tasks (avg)", xp: 45, xpPerHour: 30_000, levelReq: 50 },
    { name: "Konar tasks (avg)", xp: 40, xpPerHour: 25_000, levelReq: 1 },
    { name: "Barrage tasks", xp: 170, xpPerHour: 100_000, levelReq: 70 },
  ],
  Farming: [
    { name: "Ranarr herbs", xp: 27, xpPerHour: 50_000, levelReq: 32, itemId: 5295, itemName: "Ranarr seed" },
    { name: "Snapdragon herbs", xp: 98.5, xpPerHour: 100_000, levelReq: 62, itemId: 5300, itemName: "Snapdragon seed" },
    { name: "Magic trees", xp: 13768, xpPerHour: 35_000, levelReq: 75, itemId: 5316, itemName: "Magic seed" },
    { name: "Palm trees", xp: 10150, xpPerHour: 30_000, levelReq: 68, itemId: 5289, itemName: "Palm tree seed" },
    { name: "Tithe Farm", xp: 100, xpPerHour: 90_000, levelReq: 34 },
  ],
  Construction: [
    { name: "Oak larders", xp: 480, xpPerHour: 250_000, levelReq: 33, itemId: 8778, itemName: "Oak plank", itemsPerAction: 8 },
    { name: "Mahogany tables", xp: 840, xpPerHour: 900_000, levelReq: 52, itemId: 8782, itemName: "Mahogany plank", itemsPerAction: 6 },
    { name: "Mythical capes", xp: 370, xpPerHour: 580_000, levelReq: 47, itemId: 8778, itemName: "Teak plank", itemsPerAction: 3 },
  ],
  Hunter: [
    { name: "Bird houses", xp: 280, xpPerHour: 100_000, levelReq: 5 },
    { name: "Red chinchompas", xp: 265, xpPerHour: 150_000, levelReq: 63 },
    { name: "Black chinchompas", xp: 315, xpPerHour: 200_000, levelReq: 73 },
    { name: "Herbiboar", xp: 1950, xpPerHour: 160_000, levelReq: 80 },
  ],
  Sailing: [
    { name: "Voyages", xp: 200, xpPerHour: 50_000, levelReq: 1 },
    { name: "Port activities", xp: 150, xpPerHour: 35_000, levelReq: 1 },
  ],
};
