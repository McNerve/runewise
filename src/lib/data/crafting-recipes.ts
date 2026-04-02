export interface CraftingRecipe {
  name: string;
  levelReq: number;
  xp: number;
  materialId: number;
  materialName: string;
  materialQty: number;
  productId: number;
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  // Leather
  { name: "Leather gloves", levelReq: 1, xp: 13.8, materialId: 1741, materialName: "Leather", materialQty: 1, productId: 1059 },
  { name: "Leather body", levelReq: 14, xp: 25, materialId: 1741, materialName: "Leather", materialQty: 1, productId: 1129 },
  { name: "Hardleather body", levelReq: 28, xp: 35, materialId: 1743, materialName: "Hard leather", materialQty: 1, productId: 1131 },

  // Dragonhide
  { name: "Green d'hide vambraces", levelReq: 57, xp: 62, materialId: 1745, materialName: "Green dragon leather", materialQty: 1, productId: 1065 },
  { name: "Green d'hide body", levelReq: 63, xp: 186, materialId: 1745, materialName: "Green dragon leather", materialQty: 3, productId: 1135 },
  { name: "Blue d'hide vambraces", levelReq: 66, xp: 70, materialId: 2505, materialName: "Blue dragon leather", materialQty: 1, productId: 2487 },
  { name: "Blue d'hide body", levelReq: 71, xp: 210, materialId: 2505, materialName: "Blue dragon leather", materialQty: 3, productId: 2499 },
  { name: "Red d'hide body", levelReq: 77, xp: 234, materialId: 2507, materialName: "Red dragon leather", materialQty: 3, productId: 2501 },
  { name: "Black d'hide body", levelReq: 84, xp: 258, materialId: 2509, materialName: "Black dragon leather", materialQty: 3, productId: 2503 },

  // Gems
  { name: "Cut sapphire", levelReq: 20, xp: 50, materialId: 1623, materialName: "Uncut sapphire", materialQty: 1, productId: 1607 },
  { name: "Cut emerald", levelReq: 27, xp: 67.5, materialId: 1621, materialName: "Uncut emerald", materialQty: 1, productId: 1605 },
  { name: "Cut ruby", levelReq: 43, xp: 85, materialId: 1619, materialName: "Uncut ruby", materialQty: 1, productId: 1603 },
  { name: "Cut diamond", levelReq: 43, xp: 107.5, materialId: 1617, materialName: "Uncut diamond", materialQty: 1, productId: 1601 },
  { name: "Cut dragonstone", levelReq: 55, xp: 137.5, materialId: 1631, materialName: "Uncut dragonstone", materialQty: 1, productId: 1615 },
  { name: "Cut onyx", levelReq: 67, xp: 167.5, materialId: 6571, materialName: "Uncut onyx", materialQty: 1, productId: 6573 },
  { name: "Cut zenyte", levelReq: 89, xp: 200, materialId: 19496, materialName: "Uncut zenyte", materialQty: 1, productId: 19493 },

  // Glass
  { name: "Beer glass", levelReq: 1, xp: 17.5, materialId: 1775, materialName: "Molten glass", materialQty: 1, productId: 1919 },
  { name: "Unpowered orb", levelReq: 46, xp: 52.5, materialId: 1775, materialName: "Molten glass", materialQty: 1, productId: 567 },
  { name: "Lantern lens", levelReq: 49, xp: 55, materialId: 1775, materialName: "Molten glass", materialQty: 1, productId: 4542 },
  { name: "Light orb", levelReq: 87, xp: 70, materialId: 1775, materialName: "Molten glass", materialQty: 1, productId: 10973 },

  // Jewellery
  { name: "Gold ring", levelReq: 5, xp: 15, materialId: 2357, materialName: "Gold bar", materialQty: 1, productId: 1635 },
  { name: "Gold necklace", levelReq: 6, xp: 20, materialId: 2357, materialName: "Gold bar", materialQty: 1, productId: 1654 },
  { name: "Gold bracelet", levelReq: 7, xp: 25, materialId: 2357, materialName: "Gold bar", materialQty: 1, productId: 11069 },
  { name: "Gold amulet (u)", levelReq: 8, xp: 30, materialId: 2357, materialName: "Gold bar", materialQty: 1, productId: 1673 },
];
