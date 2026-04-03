export interface PatchType {
  name: string;
  category: string;
  growthMinutes: number;
  stages?: number;
  icon: string;
}

// Growth data sourced from RuneLite Produce.java
// Formula: growthMinutes = tickRate * stages
export const PATCH_TYPES: PatchType[] = [
  // Herbs (20 min tick × 4 stages = 80 min)
  { name: "Herb patch", category: "Herbs", growthMinutes: 80, stages: 4, icon: "Ranarr_seed_5.png" },

  // Allotments (10 min tick × variable stages)
  { name: "Potato / Onion / Cabbage", category: "Allotments", growthMinutes: 40, stages: 4, icon: "Potato_seed_5.png" },
  { name: "Tomato", category: "Allotments", growthMinutes: 40, stages: 4, icon: "Tomato_seed_5.png" },
  { name: "Sweetcorn", category: "Allotments", growthMinutes: 60, stages: 6, icon: "Sweetcorn_seed_5.png" },
  { name: "Strawberry", category: "Allotments", growthMinutes: 60, stages: 6, icon: "Strawberry_seed_5.png" },
  { name: "Watermelon", category: "Allotments", growthMinutes: 80, stages: 8, icon: "Watermelon_seed_5.png" },
  { name: "Snape grass", category: "Allotments", growthMinutes: 70, stages: 7, icon: "Snape_grass_seed_5.png" },

  // Flowers (5 min tick × 4 stages = 20 min)
  { name: "Flower patch", category: "Flowers", growthMinutes: 20, stages: 4, icon: "Marigold_seed_5.png" },

  // Trees (40 min tick × variable stages)
  { name: "Oak tree", category: "Trees", growthMinutes: 200, stages: 5, icon: "Oak_sapling.png" },
  { name: "Willow tree", category: "Trees", growthMinutes: 280, stages: 7, icon: "Willow_sapling.png" },
  { name: "Maple tree", category: "Trees", growthMinutes: 320, stages: 8, icon: "Maple_sapling.png" },
  { name: "Yew tree", category: "Trees", growthMinutes: 400, stages: 10, icon: "Yew_sapling.png" },
  { name: "Magic tree", category: "Trees", growthMinutes: 480, stages: 12, icon: "Magic_sapling.png" },

  // Fruit Trees (160 min tick × 6 stages = 960 min)
  { name: "Apple tree", category: "Fruit Trees", growthMinutes: 960, stages: 6, icon: "Apple_sapling.png" },
  { name: "Banana tree", category: "Fruit Trees", growthMinutes: 960, stages: 6, icon: "Banana_sapling.png" },
  { name: "Orange tree", category: "Fruit Trees", growthMinutes: 960, stages: 6, icon: "Orange_sapling.png" },
  { name: "Curry tree", category: "Fruit Trees", growthMinutes: 960, stages: 6, icon: "Curry_sapling.png" },
  { name: "Pineapple tree", category: "Fruit Trees", growthMinutes: 960, stages: 6, icon: "Pineapple_sapling.png" },
  { name: "Papaya tree", category: "Fruit Trees", growthMinutes: 960, stages: 6, icon: "Papaya_sapling.png" },
  { name: "Palm tree", category: "Fruit Trees", growthMinutes: 960, stages: 6, icon: "Palm_sapling.png" },
  { name: "Dragonfruit tree", category: "Fruit Trees", growthMinutes: 960, stages: 6, icon: "Dragonfruit_sapling.png" },

  // Hardwood Trees (640 min tick × variable stages)
  { name: "Teak tree", category: "Hardwood", growthMinutes: 4480, stages: 7, icon: "Teak_sapling.png" },
  { name: "Mahogany tree", category: "Hardwood", growthMinutes: 5120, stages: 8, icon: "Mahogany_sapling.png" },

  // Bushes (20 min tick × variable stages)
  { name: "Redberry bush", category: "Bushes", growthMinutes: 100, stages: 5, icon: "Redberry_seed_5.png" },
  { name: "Cadavaberry bush", category: "Bushes", growthMinutes: 120, stages: 6, icon: "Cadavaberry_seed_5.png" },
  { name: "Dwellberry bush", category: "Bushes", growthMinutes: 140, stages: 7, icon: "Dwellberry_seed_5.png" },
  { name: "Jangerberry bush", category: "Bushes", growthMinutes: 160, stages: 8, icon: "Jangerberry_seed_5.png" },
  { name: "Whiteberry bush", category: "Bushes", growthMinutes: 160, stages: 8, icon: "Whiteberry_seed_5.png" },
  { name: "Poison ivy bush", category: "Bushes", growthMinutes: 160, stages: 8, icon: "Poison_ivy_seed_5.png" },

  // Hops (10 min tick × variable stages)
  { name: "Barley", category: "Hops", growthMinutes: 40, stages: 4, icon: "Barley_seed_5.png" },
  { name: "Hammerstone hops", category: "Hops", growthMinutes: 40, stages: 4, icon: "Hammerstone_seed_5.png" },
  { name: "Asgarnian hops", category: "Hops", growthMinutes: 50, stages: 5, icon: "Asgarnian_seed_5.png" },
  { name: "Jute fibre", category: "Hops", growthMinutes: 50, stages: 5, icon: "Jute_seed_5.png" },
  { name: "Yanillian hops", category: "Hops", growthMinutes: 60, stages: 6, icon: "Yanillian_seed_5.png" },
  { name: "Krandorian hops", category: "Hops", growthMinutes: 70, stages: 7, icon: "Krandorian_seed_5.png" },
  { name: "Wildblood hops", category: "Hops", growthMinutes: 80, stages: 8, icon: "Wildblood_seed_5.png" },

  // Cactus (80/10 min tick)
  { name: "Cactus", category: "Cactus", growthMinutes: 560, stages: 7, icon: "Cactus_seed.png" },
  { name: "Potato cactus", category: "Cactus", growthMinutes: 70, stages: 7, icon: "Potato_cactus_seed.png" },

  // Special
  { name: "Seaweed", category: "Special", growthMinutes: 40, stages: 4, icon: "Seaweed_spore_5.png" },
  { name: "Mushroom", category: "Special", growthMinutes: 240, stages: 6, icon: "Mushroom_spore.png" },
  { name: "Belladonna", category: "Special", growthMinutes: 320, stages: 4, icon: "Belladonna_seed.png" },
  { name: "Calquat tree", category: "Special", growthMinutes: 1280, stages: 8, icon: "Calquat_sapling.png" },
  { name: "Spirit tree", category: "Special", growthMinutes: 3840, stages: 12, icon: "Spirit_sapling.png" },
  { name: "Celastrus tree", category: "Special", growthMinutes: 800, stages: 5, icon: "Celastrus_sapling.png" },
  { name: "Redwood tree", category: "Special", growthMinutes: 6400, stages: 10, icon: "Redwood_sapling.png" },
  { name: "Hespori", category: "Special", growthMinutes: 1920, stages: 3, icon: "Hespori_seed_5.png" },
  { name: "Crystal tree", category: "Special", growthMinutes: 480, stages: 6, icon: "Crystal_sapling.png" },

  // Anima (640 min tick × 8 stages)
  { name: "Attas plant", category: "Anima", growthMinutes: 5120, stages: 8, icon: "Attas_seed.png" },
  { name: "Iasor plant", category: "Anima", growthMinutes: 5120, stages: 8, icon: "Iasor_seed.png" },
  { name: "Kronos plant", category: "Anima", growthMinutes: 5120, stages: 8, icon: "Kronos_seed.png" },

  // Compost (40 min tick × 2 stages)
  { name: "Compost bin", category: "Compost", growthMinutes: 80, stages: 2, icon: "Compost.png" },

  // Birdhouses (50 min fixed)
  { name: "Regular birdhouse", category: "Birdhouse", growthMinutes: 50, icon: "Bird_house.png" },
  { name: "Oak birdhouse", category: "Birdhouse", growthMinutes: 50, icon: "Oak_bird_house.png" },
  { name: "Willow birdhouse", category: "Birdhouse", growthMinutes: 50, icon: "Willow_bird_house.png" },
  { name: "Teak birdhouse", category: "Birdhouse", growthMinutes: 50, icon: "Teak_bird_house.png" },
  { name: "Maple birdhouse", category: "Birdhouse", growthMinutes: 50, icon: "Maple_bird_house.png" },
  { name: "Yew birdhouse", category: "Birdhouse", growthMinutes: 50, icon: "Yew_bird_house.png" },
  { name: "Magic birdhouse", category: "Birdhouse", growthMinutes: 50, icon: "Magic_bird_house.png" },
  { name: "Redwood birdhouse", category: "Birdhouse", growthMinutes: 50, icon: "Redwood_bird_house.png" },
];

export const PATCH_CATEGORIES = [...new Set(PATCH_TYPES.map((p) => p.category))];

export const PRESETS: { name: string; patches: string[] }[] = [
  { name: "Herb Run", patches: ["Herb patch", "Herb patch", "Herb patch", "Herb patch", "Herb patch", "Herb patch", "Flower patch"] },
  { name: "Tree Run", patches: ["Oak tree", "Willow tree", "Maple tree", "Yew tree", "Magic tree"] },
  { name: "Fruit Tree Run", patches: ["Apple tree", "Palm tree", "Dragonfruit tree", "Papaya tree"] },
  { name: "Birdhouse Run", patches: ["Maple birdhouse", "Maple birdhouse", "Maple birdhouse", "Maple birdhouse"] },
  { name: "Hardwood Run", patches: ["Teak tree", "Mahogany tree", "Mahogany tree"] },
  { name: "Full Tree Run", patches: ["Oak tree", "Willow tree", "Maple tree", "Yew tree", "Magic tree", "Celastrus tree"] },
  { name: "Seaweed Run", patches: ["Seaweed", "Seaweed", "Seaweed", "Seaweed", "Seaweed"] },
  { name: "Bush Run", patches: ["Poison ivy bush", "Poison ivy bush", "Poison ivy bush", "Poison ivy bush"] },
  { name: "Cactus Run", patches: ["Cactus", "Potato cactus", "Potato cactus"] },
  { name: "Allotment Run", patches: ["Watermelon", "Watermelon", "Snape grass", "Snape grass"] },
];
