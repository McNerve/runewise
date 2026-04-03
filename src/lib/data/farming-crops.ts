export interface FarmCrop {
  name: string;
  category: string;
  seedName: string;
  seedId: number;
  produceName: string;
  produceId: number;
  levelReq: number;
  growthMinutes: number;
  /** Average yield per patch (herbs vary, trees give 1 log, etc.) */
  avgYield: number;
  /** Number of patches available for this crop */
  patches: number;
}

// Yields from wiki averages with ultracompost
export const FARM_CROPS: FarmCrop[] = [
  // Herbs (avg 8.5 with ultracompost at 99)
  { name: "Guam leaf", category: "Herbs", seedName: "Guam seed", seedId: 5291, produceName: "Grimy guam leaf", produceId: 199, levelReq: 9, growthMinutes: 80, avgYield: 8.5, patches: 9 },
  { name: "Marrentill", category: "Herbs", seedName: "Marrentill seed", seedId: 5292, produceName: "Grimy marrentill", produceId: 201, levelReq: 14, growthMinutes: 80, avgYield: 8.5, patches: 9 },
  { name: "Tarromin", category: "Herbs", seedName: "Tarromin seed", seedId: 5293, produceName: "Grimy tarromin", produceId: 203, levelReq: 19, growthMinutes: 80, avgYield: 8.5, patches: 9 },
  { name: "Harralander", category: "Herbs", seedName: "Harralander seed", seedId: 5294, produceName: "Grimy harralander", produceId: 205, levelReq: 26, growthMinutes: 80, avgYield: 8.5, patches: 9 },
  { name: "Ranarr weed", category: "Herbs", seedName: "Ranarr seed", seedId: 5295, produceName: "Grimy ranarr weed", produceId: 207, levelReq: 32, growthMinutes: 80, avgYield: 8.5, patches: 9 },
  { name: "Toadflax", category: "Herbs", seedName: "Toadflax seed", seedId: 5296, produceName: "Grimy toadflax", produceId: 3049, levelReq: 38, growthMinutes: 80, avgYield: 8.5, patches: 9 },
  { name: "Irit leaf", category: "Herbs", seedName: "Irit seed", seedId: 5297, produceName: "Grimy irit leaf", produceId: 209, levelReq: 44, growthMinutes: 80, avgYield: 8.5, patches: 9 },
  { name: "Avantoe", category: "Herbs", seedName: "Avantoe seed", seedId: 5298, produceName: "Grimy avantoe", produceId: 211, levelReq: 50, growthMinutes: 80, avgYield: 8.5, patches: 9 },
  { name: "Kwuarm", category: "Herbs", seedName: "Kwuarm seed", seedId: 5299, produceName: "Grimy kwuarm", produceId: 213, levelReq: 56, growthMinutes: 80, avgYield: 8.5, patches: 9 },
  { name: "Snapdragon", category: "Herbs", seedName: "Snapdragon seed", seedId: 5300, produceName: "Grimy snapdragon", produceId: 3051, levelReq: 62, growthMinutes: 80, avgYield: 8.5, patches: 9 },
  { name: "Cadantine", category: "Herbs", seedName: "Cadantine seed", seedId: 5301, produceName: "Grimy cadantine", produceId: 215, levelReq: 67, growthMinutes: 80, avgYield: 8.5, patches: 9 },
  { name: "Lantadyme", category: "Herbs", seedName: "Lantadyme seed", seedId: 5302, produceName: "Grimy lantadyme", produceId: 2485, levelReq: 73, growthMinutes: 80, avgYield: 8.5, patches: 9 },
  { name: "Dwarf weed", category: "Herbs", seedName: "Dwarf weed seed", seedId: 5303, produceName: "Grimy dwarf weed", produceId: 217, levelReq: 79, growthMinutes: 80, avgYield: 8.5, patches: 9 },
  { name: "Torstol", category: "Herbs", seedName: "Torstol seed", seedId: 5304, produceName: "Grimy torstol", produceId: 219, levelReq: 85, growthMinutes: 80, avgYield: 8.5, patches: 9 },

  // Allotments (avg yield ~10 with ultracompost)
  { name: "Watermelon", category: "Allotments", seedName: "Watermelon seed", seedId: 5321, produceName: "Watermelon", produceId: 5982, levelReq: 47, growthMinutes: 80, avgYield: 10, patches: 8 },
  { name: "Snape grass", category: "Allotments", seedName: "Snape grass seed", seedId: 22879, produceName: "Snape grass", produceId: 231, levelReq: 61, growthMinutes: 70, avgYield: 10, patches: 8 },
  { name: "Sweetcorn", category: "Allotments", seedName: "Sweetcorn seed", seedId: 5320, produceName: "Sweetcorn", produceId: 5986, levelReq: 20, growthMinutes: 60, avgYield: 10, patches: 8 },
  { name: "Strawberry", category: "Allotments", seedName: "Strawberry seed", seedId: 5323, produceName: "Strawberry", produceId: 5504, levelReq: 31, growthMinutes: 60, avgYield: 10, patches: 8 },

  // Normal Trees (1 log yield per patch, 5 patches)
  { name: "Oak tree", category: "Trees", seedName: "Oak sapling", seedId: 5370, produceName: "Oak logs", produceId: 1521, levelReq: 15, growthMinutes: 200, avgYield: 1, patches: 5 },
  { name: "Willow tree", category: "Trees", seedName: "Willow sapling", seedId: 5371, produceName: "Willow logs", produceId: 1519, levelReq: 30, growthMinutes: 280, avgYield: 1, patches: 5 },
  { name: "Maple tree", category: "Trees", seedName: "Maple sapling", seedId: 5372, produceName: "Maple logs", produceId: 1517, levelReq: 45, growthMinutes: 320, avgYield: 1, patches: 5 },
  { name: "Yew tree", category: "Trees", seedName: "Yew sapling", seedId: 5315, produceName: "Yew logs", produceId: 1515, levelReq: 60, growthMinutes: 400, avgYield: 1, patches: 5 },
  { name: "Magic tree", category: "Trees", seedName: "Magic sapling", seedId: 5316, produceName: "Magic logs", produceId: 1513, levelReq: 75, growthMinutes: 480, avgYield: 1, patches: 5 },

  // Fruit Trees (6 fruit per patch, 6 patches)
  { name: "Apple tree", category: "Fruit Trees", seedName: "Apple sapling", seedId: 5283, produceName: "Cooking apple", produceId: 1955, levelReq: 27, growthMinutes: 960, avgYield: 6, patches: 6 },
  { name: "Banana tree", category: "Fruit Trees", seedName: "Banana sapling", seedId: 5284, produceName: "Banana", produceId: 1963, levelReq: 33, growthMinutes: 960, avgYield: 6, patches: 6 },
  { name: "Orange tree", category: "Fruit Trees", seedName: "Orange sapling", seedId: 5285, produceName: "Orange", produceId: 2108, levelReq: 39, growthMinutes: 960, avgYield: 6, patches: 6 },
  { name: "Curry tree", category: "Fruit Trees", seedName: "Curry sapling", seedId: 5286, produceName: "Curry leaf", produceId: 5970, levelReq: 42, growthMinutes: 960, avgYield: 6, patches: 6 },
  { name: "Pineapple tree", category: "Fruit Trees", seedName: "Pineapple sapling", seedId: 5287, produceName: "Pineapple", produceId: 2114, levelReq: 51, growthMinutes: 960, avgYield: 6, patches: 6 },
  { name: "Papaya tree", category: "Fruit Trees", seedName: "Papaya sapling", seedId: 5288, produceName: "Papaya fruit", produceId: 5972, levelReq: 57, growthMinutes: 960, avgYield: 6, patches: 6 },
  { name: "Palm tree", category: "Fruit Trees", seedName: "Palm sapling", seedId: 5289, produceName: "Coconut", produceId: 5974, levelReq: 68, growthMinutes: 960, avgYield: 6, patches: 6 },
  { name: "Dragonfruit tree", category: "Fruit Trees", seedName: "Dragonfruit sapling", seedId: 22877, produceName: "Dragonfruit", produceId: 22929, levelReq: 81, growthMinutes: 960, avgYield: 6, patches: 6 },

  // Hardwood Trees (Fossil Island, 2-3 patches)
  { name: "Teak tree", category: "Hardwood", seedName: "Teak sapling", seedId: 21480, produceName: "Teak logs", produceId: 6333, levelReq: 35, growthMinutes: 4480, avgYield: 1, patches: 3 },
  { name: "Mahogany tree", category: "Hardwood", seedName: "Mahogany sapling", seedId: 21482, produceName: "Mahogany logs", produceId: 6332, levelReq: 55, growthMinutes: 5120, avgYield: 1, patches: 3 },
  { name: "Redwood tree", category: "Hardwood", seedName: "Redwood sapling", seedId: 22871, produceName: "Redwood logs", produceId: 19669, levelReq: 90, growthMinutes: 6400, avgYield: 1, patches: 1 },
  { name: "Rosewood tree", category: "Hardwood", seedName: "Rosewood sapling", seedId: 31406, produceName: "Rosewood logs", produceId: 31407, levelReq: 50, growthMinutes: 5120, avgYield: 1, patches: 3 },
  { name: "Ironwood tree", category: "Hardwood", seedName: "Ironwood sapling", seedId: 31408, produceName: "Ironwood logs", produceId: 31409, levelReq: 60, growthMinutes: 5120, avgYield: 1, patches: 3 },
  { name: "Camphorwood tree", category: "Hardwood", seedName: "Camphorwood sapling", seedId: 31410, produceName: "Camphorwood logs", produceId: 31411, levelReq: 70, growthMinutes: 5120, avgYield: 1, patches: 3 },

  // Special Trees (single patches)
  { name: "Calquat tree", category: "Special", seedName: "Calquat sapling", seedId: 5290, produceName: "Calquat fruit", produceId: 5979, levelReq: 72, growthMinutes: 1280, avgYield: 6, patches: 1 },
  { name: "Spirit tree", category: "Special", seedName: "Spirit sapling", seedId: 5317, produceName: "Spirit tree", produceId: 5317, levelReq: 83, growthMinutes: 3840, avgYield: 1, patches: 3 },
  { name: "Celastrus tree", category: "Special", seedName: "Celastrus sapling", seedId: 22869, produceName: "Battlestaff", produceId: 1391, levelReq: 85, growthMinutes: 800, avgYield: 6, patches: 1 },
  { name: "Redwood tree", category: "Special", seedName: "Redwood sapling", seedId: 22871, produceName: "Redwood logs", produceId: 19669, levelReq: 90, growthMinutes: 6400, avgYield: 1, patches: 1 },
  { name: "Crystal tree", category: "Special", seedName: "Crystal sapling", seedId: 23957, produceName: "Crystal acorn", produceId: 23955, levelReq: 74, growthMinutes: 480, avgYield: 1, patches: 1 },

  // Other Special
  { name: "Seaweed", category: "Special", seedName: "Seaweed spore", seedId: 21490, produceName: "Giant seaweed", produceId: 21504, levelReq: 23, growthMinutes: 40, avgYield: 3, patches: 2 },
  { name: "Cactus", category: "Special", seedName: "Cactus seed", seedId: 5280, produceName: "Cactus spine", produceId: 6016, levelReq: 55, growthMinutes: 560, avgYield: 3, patches: 2 },
  { name: "Potato cactus", category: "Special", seedName: "Potato cactus seed", seedId: 22873, produceName: "Potato cactus", produceId: 3138, levelReq: 64, growthMinutes: 70, avgYield: 3, patches: 2 },
];

export const CROP_CATEGORIES = [...new Set(FARM_CROPS.map((c) => c.category))];
