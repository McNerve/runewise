export interface BossDrop {
  itemName: string;
  itemId: number;
  rate: number;
  quantity: number;
  category: "unique" | "rare" | "common";
}

export interface BossDropTable {
  bossName: string;
  killsPerHour: number;
  drops: BossDrop[];
}

export const BOSS_DROP_TABLES: BossDropTable[] = [
  {
    bossName: "Vorkath",
    killsPerHour: 30,
    drops: [
      { itemName: "Draconic visage", itemId: 11286, rate: 5000, quantity: 1, category: "unique" },
      { itemName: "Skeletal visage", itemId: 22006, rate: 5000, quantity: 1, category: "unique" },
      { itemName: "Dragonbone necklace", itemId: 22111, rate: 1000, quantity: 1, category: "unique" },
      { itemName: "Vorkath's head", itemId: 21907, rate: 50, quantity: 1, category: "rare" },
      { itemName: "Superior dragon bones", itemId: 22124, rate: 1, quantity: 2, category: "common" },
      { itemName: "Blue dragonhide", itemId: 1751, rate: 1, quantity: 2, category: "common" },
    ],
  },
  {
    bossName: "Zulrah",
    killsPerHour: 25,
    drops: [
      { itemName: "Tanzanite fang", itemId: 12922, rate: 512, quantity: 1, category: "unique" },
      { itemName: "Magic fang", itemId: 12932, rate: 512, quantity: 1, category: "unique" },
      { itemName: "Serpentine visage", itemId: 12927, rate: 512, quantity: 1, category: "unique" },
      { itemName: "Uncut onyx", itemId: 6571, rate: 512, quantity: 1, category: "unique" },
      { itemName: "Jar of swamp", itemId: 12936, rate: 3000, quantity: 1, category: "rare" },
      { itemName: "Zulrah's scales", itemId: 12934, rate: 1, quantity: 250, category: "common" },
      { itemName: "Snakeskin", itemId: 6289, rate: 1, quantity: 35, category: "common" },
    ],
  },
  {
    bossName: "Corporeal Beast",
    killsPerHour: 8,
    drops: [
      { itemName: "Elysian sigil", itemId: 12819, rate: 4095, quantity: 1, category: "unique" },
      { itemName: "Spectral sigil", itemId: 12823, rate: 1365, quantity: 1, category: "unique" },
      { itemName: "Arcane sigil", itemId: 12827, rate: 1365, quantity: 1, category: "unique" },
      { itemName: "Holy elixir", itemId: 12833, rate: 171, quantity: 1, category: "rare" },
      { itemName: "Spirit shield", itemId: 12829, rate: 64, quantity: 1, category: "rare" },
      { itemName: "Onyx bolts (e)", itemId: 9245, rate: 1, quantity: 175, category: "common" },
    ],
  },
  {
    bossName: "General Graardor",
    killsPerHour: 20,
    drops: [
      { itemName: "Bandos chestplate", itemId: 11832, rate: 381, quantity: 1, category: "unique" },
      { itemName: "Bandos tassets", itemId: 11834, rate: 381, quantity: 1, category: "unique" },
      { itemName: "Bandos boots", itemId: 11836, rate: 381, quantity: 1, category: "unique" },
      { itemName: "Bandos hilt", itemId: 11812, rate: 508, quantity: 1, category: "unique" },
      { itemName: "Godsword shard 1", itemId: 11818, rate: 256, quantity: 1, category: "rare" },
      { itemName: "Godsword shard 2", itemId: 11820, rate: 256, quantity: 1, category: "rare" },
      { itemName: "Godsword shard 3", itemId: 11822, rate: 256, quantity: 1, category: "rare" },
    ],
  },
  {
    bossName: "Commander Zilyana",
    killsPerHour: 25,
    drops: [
      { itemName: "Armadyl crossbow", itemId: 11785, rate: 508, quantity: 1, category: "unique" },
      { itemName: "Saradomin sword", itemId: 11838, rate: 127, quantity: 1, category: "unique" },
      { itemName: "Saradomin's light", itemId: 13256, rate: 254, quantity: 1, category: "unique" },
      { itemName: "Saradomin hilt", itemId: 11814, rate: 508, quantity: 1, category: "unique" },
      { itemName: "Godsword shard 1", itemId: 11818, rate: 256, quantity: 1, category: "rare" },
      { itemName: "Godsword shard 2", itemId: 11820, rate: 256, quantity: 1, category: "rare" },
      { itemName: "Godsword shard 3", itemId: 11822, rate: 256, quantity: 1, category: "rare" },
    ],
  },
  {
    bossName: "K'ril Tsutsaroth",
    killsPerHour: 20,
    drops: [
      { itemName: "Zamorakian spear", itemId: 11824, rate: 127, quantity: 1, category: "unique" },
      { itemName: "Staff of the dead", itemId: 11791, rate: 508, quantity: 1, category: "unique" },
      { itemName: "Zamorak hilt", itemId: 11816, rate: 508, quantity: 1, category: "unique" },
      { itemName: "Steam battlestaff", itemId: 11787, rate: 127, quantity: 1, category: "unique" },
      { itemName: "Godsword shard 1", itemId: 11818, rate: 256, quantity: 1, category: "rare" },
      { itemName: "Godsword shard 2", itemId: 11820, rate: 256, quantity: 1, category: "rare" },
      { itemName: "Godsword shard 3", itemId: 11822, rate: 256, quantity: 1, category: "rare" },
    ],
  },
  {
    bossName: "Kree'arra",
    killsPerHour: 20,
    drops: [
      { itemName: "Armadyl helmet", itemId: 11826, rate: 381, quantity: 1, category: "unique" },
      { itemName: "Armadyl chestplate", itemId: 11828, rate: 381, quantity: 1, category: "unique" },
      { itemName: "Armadyl chainskirt", itemId: 11830, rate: 381, quantity: 1, category: "unique" },
      { itemName: "Armadyl hilt", itemId: 11810, rate: 508, quantity: 1, category: "unique" },
      { itemName: "Godsword shard 1", itemId: 11818, rate: 256, quantity: 1, category: "rare" },
      { itemName: "Godsword shard 2", itemId: 11820, rate: 256, quantity: 1, category: "rare" },
      { itemName: "Godsword shard 3", itemId: 11822, rate: 256, quantity: 1, category: "rare" },
    ],
  },
  {
    bossName: "Cerberus",
    killsPerHour: 35,
    drops: [
      { itemName: "Primordial crystal", itemId: 13231, rate: 512, quantity: 1, category: "unique" },
      { itemName: "Pegasian crystal", itemId: 13229, rate: 512, quantity: 1, category: "unique" },
      { itemName: "Eternal crystal", itemId: 13227, rate: 512, quantity: 1, category: "unique" },
      { itemName: "Smouldering stone", itemId: 13233, rate: 512, quantity: 1, category: "unique" },
      { itemName: "Jar of souls", itemId: 13245, rate: 2000, quantity: 1, category: "rare" },
    ],
  },
  {
    bossName: "Alchemical Hydra",
    killsPerHour: 28,
    drops: [
      { itemName: "Hydra's claw", itemId: 22966, rate: 1001, quantity: 1, category: "unique" },
      { itemName: "Hydra leather", itemId: 22983, rate: 514, quantity: 1, category: "unique" },
      { itemName: "Hydra tail", itemId: 22988, rate: 514, quantity: 1, category: "unique" },
      { itemName: "Jar of chemicals", itemId: 23064, rate: 2000, quantity: 1, category: "rare" },
      { itemName: "Dragon bones", itemId: 536, rate: 1, quantity: 2, category: "common" },
      { itemName: "Dragon knife", itemId: 22804, rate: 10, quantity: 15, category: "common" },
    ],
  },
  {
    bossName: "Thermonuclear Smoke Devil",
    killsPerHour: 35,
    drops: [
      { itemName: "Occult necklace", itemId: 12002, rate: 350, quantity: 1, category: "unique" },
      { itemName: "Smoke battlestaff", itemId: 11998, rate: 512, quantity: 1, category: "unique" },
      { itemName: "Dragon chainbody", itemId: 3140, rate: 2000, quantity: 1, category: "rare" },
      { itemName: "Jar of smoke", itemId: 22374, rate: 2000, quantity: 1, category: "rare" },
    ],
  },
  {
    bossName: "Grotesque Guardians",
    killsPerHour: 30,
    drops: [
      { itemName: "Black tourmaline core", itemId: 21730, rate: 750, quantity: 1, category: "unique" },
      { itemName: "Granite gloves", itemId: 21736, rate: 500, quantity: 1, category: "unique" },
      { itemName: "Granite ring", itemId: 21739, rate: 500, quantity: 1, category: "unique" },
      { itemName: "Granite hammer", itemId: 21742, rate: 750, quantity: 1, category: "unique" },
      { itemName: "Jar of stone", itemId: 21745, rate: 5000, quantity: 1, category: "rare" },
    ],
  },
  {
    bossName: "Sarachnis",
    killsPerHour: 40,
    drops: [
      { itemName: "Sarachnis cudgel", itemId: 23528, rate: 384, quantity: 1, category: "unique" },
      { itemName: "Giant egg sac(full)", itemId: 23517, rate: 20, quantity: 1, category: "rare" },
      { itemName: "Jar of eyes", itemId: 23525, rate: 2000, quantity: 1, category: "rare" },
    ],
  },
  {
    bossName: "Barrows",
    killsPerHour: 15,
    drops: [
      { itemName: "Barrows piece (any)", itemId: 4708, rate: 17, quantity: 1, category: "unique" },
      { itemName: "Dragon med helm", itemId: 1149, rate: 128, quantity: 1, category: "rare" },
      { itemName: "Bolt rack", itemId: 4740, rate: 1, quantity: 50, category: "common" },
      { itemName: "Death rune", itemId: 560, rate: 1, quantity: 250, category: "common" },
      { itemName: "Blood rune", itemId: 565, rate: 1, quantity: 150, category: "common" },
    ],
  },
];
