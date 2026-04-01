export interface StarTier {
  tier: number;
  miningLevel: number;
  xpPerStardust: number;
  stardustPerLayer: number;
  layerDuration: string;
}

export const STAR_TIERS: StarTier[] = [
  { tier: 1, miningLevel: 10, xpPerStardust: 14, stardustPerLayer: 15, layerDuration: "7 min" },
  { tier: 2, miningLevel: 20, xpPerStardust: 16, stardustPerLayer: 40, layerDuration: "7 min" },
  { tier: 3, miningLevel: 30, xpPerStardust: 22, stardustPerLayer: 40, layerDuration: "7 min" },
  { tier: 4, miningLevel: 40, xpPerStardust: 26, stardustPerLayer: 80, layerDuration: "7 min" },
  { tier: 5, miningLevel: 50, xpPerStardust: 32, stardustPerLayer: 80, layerDuration: "7 min" },
  { tier: 6, miningLevel: 60, xpPerStardust: 47, stardustPerLayer: 150, layerDuration: "7 min" },
  { tier: 7, miningLevel: 70, xpPerStardust: 71, stardustPerLayer: 150, layerDuration: "7 min" },
  { tier: 8, miningLevel: 80, xpPerStardust: 114, stardustPerLayer: 250, layerDuration: "7 min" },
  { tier: 9, miningLevel: 90, xpPerStardust: 145, stardustPerLayer: 250, layerDuration: "7 min" },
];

export interface StarSite {
  name: string;
  region: string;
  teleports?: string[];
}

// Teleport lookup by region/location keyword for live star locations
export const TELEPORT_HINTS: Record<string, string[]> = {
  // Asgarnia
  "crafting guild": ["Crafting cape teleport", "Falador teleport → run south"],
  "falador": ["Falador teleport", "Explorer's ring 2+ → Falador farm"],
  "dwarven mine": ["Falador teleport → run east", "Skills necklace → Mining Guild"],
  "mudskipper": ["Fairy ring AIQ", "Port Sarim lodestone"],
  "rimmington": ["House teleport (if POH in Rimmington)", "Amulet of glory → Draynor → run south"],
  "burthorpe": ["Games necklace → Burthorpe"],
  // Karamja
  "brimhaven": ["Brimhaven house teleport", "Charter ship to Brimhaven"],
  "shilo": ["Fairy ring CKR → run east", "Karamja gloves 3 → Shilo Village"],
  "nature altar": ["Fairy ring CKR"],
  "crandor": ["Karamja gloves → Crandor mine"],
  // Fremennik
  "jatizso": ["Enchanted lyre → Jatizso", "Fairy ring DKS → sail"],
  "lunar": ["Lunar Isle teleport", "Seal of passage required"],
  "miscellania": ["Fairy ring CIP", "Ring of wealth → Miscellania"],
  "rellekka": ["Enchanted lyre", "Fairy ring DKS → run south"],
  // Kandarin
  "ardougne": ["Ardougne teleport", "Ardougne cloak → Monastery"],
  "coal trucks": ["Fairy ring AJR → run south", "Kandarin headgear → Coal Trucks"],
  "legends": ["Fairy ring BLR", "Legends' Quest completion"],
  "yanille": ["Yanille house teleport", "Watchtower teleport → run south"],
  "catherby": ["Catherby teleport (Lunar)", "Camelot teleport → run south"],
  "port khazard": ["Fairy ring DJP → run south", "Charter ship"],
  // Kourend
  "lovakengj": ["Xeric's talisman → Xeric's Inferno", "Lovakengj house teleport"],
  "karuulm": ["Fairy ring CIR", "Skills necklace → Farming Guild → run north"],
  "hosidius": ["Xeric's talisman → Xeric's Glade", "Tithe Farm minigame teleport"],
  "kebos": ["Fairy ring CIR → run south"],
  "arceuus": ["Xeric's talisman → Xeric's Altar", "Fairy ring CIS"],
  // Misthalin
  "al kharid": ["Amulet of glory → Al Kharid", "Ring of dueling → PvP Arena"],
  "lumbridge": ["Lumbridge teleport", "Home teleport"],
  "varrock": ["Varrock teleport", "Grand Exchange teleport"],
  // Morytania
  "canifis": ["Fairy ring CKS", "Kharyrll teleport (Ancient)"],
  "haunted mine": ["Fairy ring CLF → run south", "Burgh de Rott teleport"],
  "theatre of blood": ["Drakan's medallion → Ver Sinhaza"],
  "burgh": ["Drakan's medallion → Burgh de Rott"],
  // Tirannwn
  "arandar": ["Charter ship to Port Tyras → run north"],
  "lletya": ["Teleport crystal → Lletya"],
  "prifddinas": ["Teleport crystal → Prifddinas", "Prifddinas portal (POH)"],
  // Wilderness
  "hobgoblin": ["Burning amulet → Lava Maze", "Wilderness Obelisk"],
  "wilderness runite": ["Wilderness Obelisk → level 44", "Burning amulet"],
  "wilderness resource": ["Wilderness Obelisk → level 50"],
  // Desert
  "desert quarry": ["Fairy ring AKS → run south", "Camulet → Enakhra's Temple"],
  "nardah": ["Desert amulet 2+ → Nardah", "Fairy ring DLQ → run south"],
  "uzer": ["Fairy ring DLQ", "Necklace of passage → Eagle's Eyrie"],
  // Gnome
  "gnome stronghold": ["Spirit tree → Gnome Stronghold", "Royal seed pod"],
  // Piscatoris
  "piscatoris": ["Fairy ring AKQ", "Western banner 3+ → Piscatoris"],
  // Feldip
  "feldip": ["Fairy ring AKS", "Gnome glider → Feldip Hills"],
  // Varlamore
  "varlamore": ["Quetzal Whistle", "Fairy ring → Varlamore"],
  "custodia": ["Quetzal Whistle → Custodia", "Colosseum teleport"],
  "colosseum": ["Colosseum teleport", "Quetzal Whistle"],
  "hunter guild": ["Hunter guild teleport", "Quetzal Whistle"],
  // Myths Guild
  "myths": ["Mythical cape teleport"],
};

export function getTeleportsForLocation(locationName: string): string[] {
  const lower = locationName.toLowerCase();
  for (const [key, teleports] of Object.entries(TELEPORT_HINTS)) {
    if (lower.includes(key)) return teleports;
  }
  return [];
}

export const STAR_SITES: StarSite[] = [
  // Asgarnia
  { name: "Crafting Guild mine", region: "Asgarnia" },
  { name: "Falador mine", region: "Asgarnia" },
  { name: "Dwarven Mine entrance", region: "Asgarnia" },
  { name: "Mudskipper Point", region: "Asgarnia" },
  { name: "Rimmington mine", region: "Asgarnia" },
  { name: "South Burthorpe mine", region: "Asgarnia" },
  // Crandor / Karamja
  { name: "Brimhaven mine (gold)", region: "Karamja" },
  { name: "Gem rocks (Shilo Village)", region: "Karamja" },
  { name: "Nature altar mine", region: "Karamja" },
  { name: "Crandor mine", region: "Karamja" },
  // Fremennik
  { name: "Jatizso mine", region: "Fremennik" },
  { name: "Lunar Isle mine", region: "Fremennik" },
  { name: "Miscellania mine", region: "Fremennik" },
  { name: "Rellekka mine", region: "Fremennik" },
  // Kandarin
  { name: "Ardougne monastery mine", region: "Kandarin" },
  { name: "Coal trucks", region: "Kandarin" },
  { name: "Legends' Guild mine", region: "Kandarin" },
  { name: "Yanille mine", region: "Kandarin" },
  // Kourend & Kebos
  { name: "Lovakengj mine", region: "Kourend" },
  { name: "Mount Karuulm mine", region: "Kourend" },
  { name: "Hosidius mine", region: "Kourend" },
  // Misthalin
  { name: "Al Kharid mine", region: "Misthalin" },
  { name: "Lumbridge Swamp mine", region: "Misthalin" },
  { name: "Varrock east mine", region: "Misthalin" },
  { name: "Varrock west mine", region: "Misthalin" },
  // Morytania
  { name: "Canifis mine", region: "Morytania" },
  { name: "Haunted Mine", region: "Morytania" },
  // Tirannwn
  { name: "Arandar mine", region: "Tirannwn" },
  { name: "Lletya mine", region: "Tirannwn" },
  { name: "Prifddinas mine", region: "Tirannwn" },
  // Wilderness
  { name: "Wilderness Hobgoblin mine", region: "Wilderness" },
  { name: "Wilderness Runite mine", region: "Wilderness" },
  { name: "Wilderness Resource Area", region: "Wilderness" },
  // Desert
  { name: "Desert Quarry", region: "Desert" },
  { name: "Nardah mine", region: "Desert" },
  { name: "Uzer mine", region: "Desert" },
];

export interface StardustReward {
  name: string;
  cost: number;
  quantity: number;
  itemId?: number;
}

export const STARDUST_REWARDS: StardustReward[] = [
  { name: "Celestial ring (uncharged)", cost: 2000, quantity: 1, itemId: 25539 },
  { name: "Star fragment", cost: 3000, quantity: 1, itemId: 25547 },
  { name: "Soft clay pack", cost: 150, quantity: 100, itemId: 11741 },
  { name: "Uncut sapphire", cost: 50, quantity: 1, itemId: 1623 },
  { name: "Uncut emerald", cost: 75, quantity: 1, itemId: 1621 },
  { name: "Uncut ruby", cost: 100, quantity: 1, itemId: 1619 },
  { name: "Uncut diamond", cost: 200, quantity: 1, itemId: 1617 },
  { name: "Uncut dragonstone", cost: 300, quantity: 1, itemId: 1631 },
  { name: "Pure essence", cost: 50, quantity: 150, itemId: 7936 },
  { name: "Gold ore", cost: 50, quantity: 20, itemId: 444 },
  { name: "Coal", cost: 50, quantity: 20, itemId: 453 },
  { name: "Adamantite ore", cost: 75, quantity: 10, itemId: 449 },
  { name: "Runite ore", cost: 200, quantity: 3, itemId: 451 },
  { name: "Mithril seeds", cost: 100, quantity: 1, itemId: 299 },
  { name: "Bag full of gems", cost: 300, quantity: 1, itemId: 12020 },
];
