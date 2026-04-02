export interface HerbloreRecipe {
  name: string;
  levelReq: number;
  xp: number;
  herbId: number;
  herbName: string;
  secondaryId: number;
  secondaryName: string;
  productId: number;
}

export const HERBLORE_RECIPES: HerbloreRecipe[] = [
  { name: "Attack potion", levelReq: 3, xp: 25, herbId: 249, herbName: "Guam leaf", secondaryId: 221, secondaryName: "Eye of newt", productId: 121 },
  { name: "Antipoison", levelReq: 5, xp: 37.5, herbId: 251, herbName: "Marrentill", secondaryId: 235, secondaryName: "Unicorn horn dust", productId: 175 },
  { name: "Strength potion", levelReq: 12, xp: 50, herbId: 253, herbName: "Tarromin", secondaryId: 225, secondaryName: "Limpwurt root", productId: 115 },
  { name: "Restore potion", levelReq: 22, xp: 62.5, herbId: 255, herbName: "Harralander", secondaryId: 223, secondaryName: "Red spiders' eggs", productId: 127 },
  { name: "Energy potion", levelReq: 26, xp: 67.5, herbId: 255, herbName: "Harralander", secondaryId: 1975, secondaryName: "Chocolate dust", productId: 3010 },
  { name: "Defence potion", levelReq: 30, xp: 75, herbId: 257, herbName: "Ranarr weed", secondaryId: 239, secondaryName: "White berries", productId: 133 },
  { name: "Prayer potion", levelReq: 38, xp: 87.5, herbId: 257, herbName: "Ranarr weed", secondaryId: 231, secondaryName: "Snape grass", productId: 139 },
  { name: "Super attack", levelReq: 45, xp: 100, herbId: 259, herbName: "Irit leaf", secondaryId: 221, secondaryName: "Eye of newt", productId: 145 },
  { name: "Super antipoison", levelReq: 48, xp: 106.3, herbId: 259, herbName: "Irit leaf", secondaryId: 235, secondaryName: "Unicorn horn dust", productId: 181 },
  { name: "Super energy", levelReq: 52, xp: 117.5, herbId: 261, herbName: "Avantoe", secondaryId: 2970, secondaryName: "Mort myre fungus", productId: 3018 },
  { name: "Super strength", levelReq: 55, xp: 125, herbId: 263, herbName: "Kwuarm", secondaryId: 225, secondaryName: "Limpwurt root", productId: 157 },
  { name: "Super restore", levelReq: 63, xp: 142.5, herbId: 3000, herbName: "Snapdragon", secondaryId: 223, secondaryName: "Red spiders' eggs", productId: 3026 },
  { name: "Super defence", levelReq: 66, xp: 150, herbId: 265, herbName: "Cadantine", secondaryId: 239, secondaryName: "White berries", productId: 163 },
  { name: "Antifire potion", levelReq: 69, xp: 157.5, herbId: 2481, herbName: "Lantadyme", secondaryId: 241, secondaryName: "Dragon scale dust", productId: 2454 },
  { name: "Ranging potion", levelReq: 72, xp: 162.5, herbId: 267, herbName: "Dwarf weed", secondaryId: 245, secondaryName: "Wine of zamorak", productId: 169 },
  { name: "Magic potion", levelReq: 76, xp: 172.5, herbId: 2481, herbName: "Lantadyme", secondaryId: 3138, secondaryName: "Potato cactus", productId: 3042 },
  { name: "Saradomin brew", levelReq: 81, xp: 180, herbId: 269, herbName: "Toadflax", secondaryId: 6693, secondaryName: "Crushed nest", productId: 6687 },
  { name: "Super combat potion", levelReq: 90, xp: 150, herbId: 269, herbName: "Torstol", secondaryId: 145, secondaryName: "Super attack(4)", productId: 12695 },
  { name: "Antivenom+", levelReq: 94, xp: 125, herbId: 269, herbName: "Torstol", secondaryId: 12905, secondaryName: "Antivenom(4)", productId: 12913 },
];
