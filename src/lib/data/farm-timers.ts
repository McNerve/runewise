export interface PatchType {
  name: string;
  category: string;
  growthMinutes: number;
  icon: string;
}

export const PATCH_TYPES: PatchType[] = [
  { name: "Herb patch", category: "Herbs", growthMinutes: 80, icon: "Ranarr_seed_5.png" },
  { name: "Allotment", category: "Herbs", growthMinutes: 80, icon: "Potato_seed_5.png" },
  { name: "Flower patch", category: "Herbs", growthMinutes: 20, icon: "Marigold_seed_5.png" },
  { name: "Oak tree", category: "Trees", growthMinutes: 200, icon: "Oak_sapling.png" },
  { name: "Willow tree", category: "Trees", growthMinutes: 280, icon: "Willow_sapling.png" },
  { name: "Maple tree", category: "Trees", growthMinutes: 320, icon: "Maple_sapling.png" },
  { name: "Yew tree", category: "Trees", growthMinutes: 400, icon: "Yew_sapling.png" },
  { name: "Magic tree", category: "Trees", growthMinutes: 480, icon: "Magic_sapling.png" },
  { name: "Apple tree", category: "Fruit Trees", growthMinutes: 960, icon: "Apple_sapling.png" },
  { name: "Palm tree", category: "Fruit Trees", growthMinutes: 960, icon: "Palm_sapling.png" },
  { name: "Dragonfruit tree", category: "Fruit Trees", growthMinutes: 960, icon: "Dragonfruit_sapling.png" },
  { name: "Birdhouse", category: "Special", growthMinutes: 50, icon: "Oak_bird_house.png" },
  { name: "Calquat tree", category: "Special", growthMinutes: 1280, icon: "Calquat_sapling.png" },
  { name: "Hardwood tree", category: "Special", growthMinutes: 3840, icon: "Teak_sapling.png" },
  { name: "Hespori", category: "Special", growthMinutes: 1920, icon: "Hespori_seed_5.png" },
  { name: "Seaweed", category: "Special", growthMinutes: 40, icon: "Seaweed_spore_5.png" },
];

export const PRESETS: { name: string; patches: string[] }[] = [
  { name: "Herb Run", patches: ["Herb patch", "Herb patch", "Herb patch", "Herb patch", "Herb patch", "Flower patch"] },
  { name: "Tree Run", patches: ["Oak tree", "Willow tree", "Maple tree", "Yew tree", "Magic tree"] },
  { name: "Fruit Tree Run", patches: ["Apple tree", "Palm tree", "Dragonfruit tree"] },
  { name: "Birdhouse Run", patches: ["Birdhouse", "Birdhouse", "Birdhouse", "Birdhouse"] },
];
