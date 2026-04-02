export interface ConstructionItem {
  name: string;
  levelReq: number;
  xp: number;
  materials: Array<{ name: string; itemId: number; quantity: number }>;
  category: string;
}

// Common construction items — focused on training-relevant items
// Materials: Oak plank (8778), Teak plank (8780), Mahogany plank (8782),
//            Steel bar (2353), Gold leaf (8784), Marble block (8786),
//            Bolt of cloth (8790), Limestone brick (3420), Soft clay (1761)
export const CONSTRUCTION_ITEMS: ConstructionItem[] = [
  // Oak items
  { name: "Oak chair", levelReq: 19, xp: 120, materials: [{ name: "Oak plank", itemId: 8778, quantity: 2 }], category: "Oak" },
  { name: "Oak dining table", levelReq: 22, xp: 240, materials: [{ name: "Oak plank", itemId: 8778, quantity: 4 }], category: "Oak" },
  { name: "Oak larder", levelReq: 33, xp: 480, materials: [{ name: "Oak plank", itemId: 8778, quantity: 8 }], category: "Oak" },
  { name: "Oak dungeon door", levelReq: 74, xp: 600, materials: [{ name: "Oak plank", itemId: 8778, quantity: 10 }], category: "Oak" },

  // Teak items
  { name: "Teak table", levelReq: 38, xp: 360, materials: [{ name: "Teak plank", itemId: 8780, quantity: 4 }], category: "Teak" },
  { name: "Teak larder", levelReq: 43, xp: 480, materials: [{ name: "Teak plank", itemId: 8780, quantity: 8 }, { name: "Bolt of cloth", itemId: 8790, quantity: 1 }], category: "Teak" },
  { name: "Mythical cape", levelReq: 47, xp: 370, materials: [{ name: "Teak plank", itemId: 8780, quantity: 3 }], category: "Teak" },
  { name: "Teak garden bench", levelReq: 66, xp: 540, materials: [{ name: "Teak plank", itemId: 8780, quantity: 6 }], category: "Teak" },

  // Mahogany items
  { name: "Mahogany table", levelReq: 52, xp: 840, materials: [{ name: "Mahogany plank", itemId: 8782, quantity: 6 }], category: "Mahogany" },
  { name: "Mahogany bookcase", levelReq: 40, xp: 420, materials: [{ name: "Mahogany plank", itemId: 8782, quantity: 3 }], category: "Mahogany" },
  { name: "Mahogany bench", levelReq: 77, xp: 840, materials: [{ name: "Mahogany plank", itemId: 8782, quantity: 6 }], category: "Mahogany" },
  { name: "Gnome bench", levelReq: 77, xp: 840, materials: [{ name: "Mahogany plank", itemId: 8782, quantity: 6 }], category: "Mahogany" },

  // Gilded items (endgame)
  { name: "Gilded bench", levelReq: 61, xp: 1760, materials: [{ name: "Mahogany plank", itemId: 8782, quantity: 4 }, { name: "Gold leaf", itemId: 8784, quantity: 4 }], category: "Gilded" },
  { name: "Gilded wardrobe", levelReq: 87, xp: 2370, materials: [{ name: "Mahogany plank", itemId: 8782, quantity: 3 }, { name: "Gold leaf", itemId: 8784, quantity: 3 }, { name: "Marble block", itemId: 8786, quantity: 1 }], category: "Gilded" },
  { name: "Gilded altar", levelReq: 75, xp: 2230, materials: [{ name: "Limestone brick", itemId: 3420, quantity: 2 }, { name: "Marble block", itemId: 8786, quantity: 2 }, { name: "Gold leaf", itemId: 8784, quantity: 4 }], category: "Gilded" },

  // Useful furniture
  { name: "Ornate rejuvenation pool", levelReq: 90, xp: 3350, materials: [{ name: "Mahogany plank", itemId: 8782, quantity: 5 }, { name: "Gold leaf", itemId: 8784, quantity: 5 }, { name: "Marble block", itemId: 8786, quantity: 3 }], category: "Useful" },
  { name: "Ornate jewellery box", levelReq: 91, xp: 2680, materials: [{ name: "Mahogany plank", itemId: 8782, quantity: 3 }, { name: "Gold leaf", itemId: 8784, quantity: 3 }, { name: "Marble block", itemId: 8786, quantity: 1 }], category: "Useful" },
  { name: "Spirit tree + fairy ring", levelReq: 95, xp: 350, materials: [{ name: "Marble block", itemId: 8786, quantity: 2 }, { name: "Gold leaf", itemId: 8784, quantity: 3 }], category: "Useful" },
  { name: "Occult altar", levelReq: 90, xp: 3445, materials: [{ name: "Mahogany plank", itemId: 8782, quantity: 5 }, { name: "Gold leaf", itemId: 8784, quantity: 4 }, { name: "Marble block", itemId: 8786, quantity: 2 }], category: "Useful" },
];

export const CONSTRUCTION_CATEGORIES = [...new Set(CONSTRUCTION_ITEMS.map((i) => i.category))];
