export interface TrainingMethod {
  name: string;
  xp: number;
  itemId?: number; // Wiki item ID for GE price lookup
  itemName?: string;
  itemsPerAction?: number; // how many items consumed per action (default 1)
}

export const TRAINING_METHODS: Record<string, TrainingMethod[]> = {
  Attack: [
    { name: "Sand Crabs", xp: 40 },
    { name: "Ammonite Crabs", xp: 52 },
    { name: "Nightmare Zone", xp: 80 },
    { name: "Slayer tasks", xp: 45 },
  ],
  Strength: [
    { name: "Sand Crabs", xp: 40 },
    { name: "Ammonite Crabs", xp: 52 },
    { name: "Nightmare Zone", xp: 80 },
    { name: "Slayer tasks", xp: 45 },
  ],
  Defence: [
    { name: "Sand Crabs", xp: 40 },
    { name: "Ammonite Crabs", xp: 52 },
    { name: "Nightmare Zone", xp: 80 },
    { name: "Slayer tasks", xp: 45 },
  ],
  Ranged: [
    { name: "Sand Crabs (MSB)", xp: 40 },
    { name: "Chinchompas (MM2)", xp: 350 },
    { name: "Ammonite Crabs", xp: 52 },
    { name: "Slayer tasks", xp: 45 },
  ],
  Prayer: [
    { name: "Bones (Gilded altar)", xp: 252, itemId: 526, itemName: "Bones" },
    { name: "Dragon bones (Gilded altar)", xp: 252, itemId: 536, itemName: "Dragon bones" },
    { name: "Superior dragon bones (Gilded altar)", xp: 525, itemId: 22124, itemName: "Superior dragon bones" },
    { name: "Dagannoth bones (Gilded altar)", xp: 437.5, itemId: 6729, itemName: "Dagannoth bones" },
    { name: "Ensouled dragon heads", xp: 1560, itemId: 13511, itemName: "Ensouled dragon head" },
  ],
  Magic: [
    { name: "High Level Alchemy", xp: 65 },
    { name: "Burst/Barrage (MM2)", xp: 170 },
    { name: "Enchant bolts", xp: 87 },
    { name: "Tan Leather", xp: 81 },
  ],
  Runecraft: [
    { name: "Guardians of the Rift", xp: 55 },
    { name: "Lava runes", xp: 26 },
    { name: "Blood runes (true altar)", xp: 24 },
    { name: "ZMI altar", xp: 40 },
  ],
  Hitpoints: [
    { name: "Any combat (1/3 of combat XP)", xp: 13 },
    { name: "Nightmare Zone", xp: 27 },
  ],
  Crafting: [
    { name: "Gold bracelets", xp: 25, itemId: 2357, itemName: "Gold bar" },
    { name: "Green d'hide bodies", xp: 186, itemId: 1745, itemName: "Green dragon leather" },
    { name: "Blue d'hide bodies", xp: 210, itemId: 2505, itemName: "Blue dragon leather" },
    { name: "Black d'hide bodies", xp: 258, itemId: 2509, itemName: "Black dragon leather" },
    { name: "Cutting gems", xp: 85 },
  ],
  Mining: [
    { name: "Iron ore", xp: 35 },
    { name: "3-tick granite", xp: 75 },
    { name: "Motherlode Mine", xp: 60 },
    { name: "Volcanic Mine", xp: 95 },
    { name: "Shooting Stars", xp: 60 },
  ],
  Smithing: [
    { name: "Gold bars (Gauntlets)", xp: 56.2, itemId: 444, itemName: "Gold ore" },
    { name: "Mithril platebodies", xp: 250, itemId: 2359, itemName: "Mithril bar", itemsPerAction: 5 },
    { name: "Adamant platebodies", xp: 312.5, itemId: 2361, itemName: "Adamantite bar", itemsPerAction: 5 },
    { name: "Blast Furnace (Steel bars)", xp: 17.5, itemId: 453, itemName: "Coal" },
  ],
  Fishing: [
    { name: "Fly fishing (Trout/Salmon)", xp: 50 },
    { name: "Barbarian fishing", xp: 70 },
    { name: "Tempoross", xp: 65 },
    { name: "Minnows", xp: 26.1 },
    { name: "Karambwanji / Karambwan", xp: 105 },
  ],
  Cooking: [
    { name: "Lobsters", xp: 120, itemId: 379, itemName: "Raw lobster" },
    { name: "Swordfish", xp: 140, itemId: 371, itemName: "Raw swordfish" },
    { name: "Monkfish", xp: 150, itemId: 7944, itemName: "Raw monkfish" },
    { name: "Sharks", xp: 210, itemId: 383, itemName: "Raw shark" },
    { name: "Karambwan (1-tick)", xp: 190, itemId: 3142, itemName: "Raw karambwan" },
  ],
  Firemaking: [
    { name: "Maple logs", xp: 135, itemId: 1517, itemName: "Maple logs" },
    { name: "Yew logs", xp: 202.5, itemId: 1515, itemName: "Yew logs" },
    { name: "Magic logs", xp: 303.8, itemId: 1513, itemName: "Magic logs" },
    { name: "Redwood logs", xp: 350, itemId: 19669, itemName: "Redwood logs" },
    { name: "Wintertodt", xp: 100 },
  ],
  Woodcutting: [
    { name: "Willows", xp: 67.5 },
    { name: "Teak trees", xp: 85 },
    { name: "Sulliuscep mushrooms", xp: 127 },
    { name: "Redwood trees", xp: 380 },
    { name: "Forestry events", xp: 90 },
  ],
  Agility: [
    { name: "Canifis course", xp: 240 },
    { name: "Seers' Village course", xp: 570 },
    { name: "Pollnivneach course", xp: 890 },
    { name: "Rellekka course", xp: 780 },
    { name: "Hallowed Sepulchre", xp: 1200 },
  ],
  Herblore: [
    { name: "Prayer potions", xp: 117.5, itemId: 231, itemName: "Snape grass" },
    { name: "Super restores", xp: 142.5, itemId: 3000, itemName: "Snapdragon" },
    { name: "Ranging potions", xp: 162.5, itemId: 245, itemName: "Dwarf weed" },
    { name: "Saradomin brews", xp: 180, itemId: 6693, itemName: "Toadflax" },
  ],
  Thieving: [
    { name: "Fruit Stalls", xp: 28.5 },
    { name: "Blackjacking", xp: 160 },
    { name: "Artefacts (Port Piscarilius)", xp: 40 },
    { name: "Knights of Ardougne", xp: 132.5 },
    { name: "Elves", xp: 353 },
  ],
  Fletching: [
    { name: "Maple longbows (u)", xp: 58.3, itemId: 1517, itemName: "Maple logs" },
    { name: "Yew longbows (u)", xp: 75, itemId: 1515, itemName: "Yew logs" },
    { name: "Magic longbows (u)", xp: 91.5, itemId: 1513, itemName: "Magic logs" },
    { name: "Broad arrows", xp: 15, itemId: 11874, itemName: "Broad arrowheads" },
    { name: "Dragon darts", xp: 25, itemId: 11232, itemName: "Dragon dart tip" },
  ],
  Slayer: [
    { name: "Duradel tasks (avg)", xp: 45 },
    { name: "Konar tasks (avg)", xp: 40 },
    { name: "Barrage tasks", xp: 170 },
  ],
  Farming: [
    { name: "Ranarr herbs", xp: 27, itemId: 5295, itemName: "Ranarr seed" },
    { name: "Snapdragon herbs", xp: 98.5, itemId: 5300, itemName: "Snapdragon seed" },
    { name: "Magic trees", xp: 13768, itemId: 5316, itemName: "Magic seed" },
    { name: "Palm trees", xp: 10150, itemId: 5289, itemName: "Palm tree seed" },
    { name: "Tithe Farm", xp: 100 },
  ],
  Construction: [
    { name: "Oak larders", xp: 480, itemId: 8778, itemName: "Oak plank", itemsPerAction: 8 },
    { name: "Mahogany tables", xp: 840, itemId: 8782, itemName: "Mahogany plank", itemsPerAction: 6 },
    { name: "Mythical capes", xp: 370, itemId: 8778, itemName: "Teak plank", itemsPerAction: 3 },
  ],
  Hunter: [
    { name: "Bird houses", xp: 280 },
    { name: "Red chinchompas", xp: 265 },
    { name: "Black chinchompas", xp: 315 },
    { name: "Herbiboar", xp: 1950 },
  ],
  Sailing: [
    { name: "Voyages", xp: 200 },
    { name: "Port activities", xp: 150 },
  ],
};
