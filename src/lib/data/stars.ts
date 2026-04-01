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
