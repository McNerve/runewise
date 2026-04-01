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
  // DT2 Bosses
  {
    bossName: "Duke Sucellus",
    killsPerHour: 20,
    drops: [
      { itemName: "Virtus mask", itemId: 26241, rate: 768, quantity: 1, category: "unique" },
      { itemName: "Virtus robe top", itemId: 26243, rate: 768, quantity: 1, category: "unique" },
      { itemName: "Virtus robe bottom", itemId: 26245, rate: 768, quantity: 1, category: "unique" },
      { itemName: "Chromium ingot", itemId: 26247, rate: 768, quantity: 1, category: "unique" },
      { itemName: "Eye of the duke", itemId: 28313, rate: 1536, quantity: 1, category: "unique" },
      { itemName: "Blood rune", itemId: 565, rate: 2, quantity: 250, category: "common" },
    ],
  },
  {
    bossName: "The Leviathan",
    killsPerHour: 18,
    drops: [
      { itemName: "Leviathan's lure", itemId: 28316, rate: 1536, quantity: 1, category: "unique" },
      { itemName: "Trident of the seas (full)", itemId: 11905, rate: 400, quantity: 1, category: "rare" },
      { itemName: "Kraken tentacle", itemId: 12004, rate: 400, quantity: 1, category: "rare" },
      { itemName: "Death rune", itemId: 560, rate: 2, quantity: 200, category: "common" },
    ],
  },
  {
    bossName: "Vardorvis",
    killsPerHour: 22,
    drops: [
      { itemName: "Executioner's axe head", itemId: 28319, rate: 768, quantity: 1, category: "unique" },
      { itemName: "Vardorvis' poll", itemId: 28322, rate: 1536, quantity: 1, category: "unique" },
      { itemName: "Blood rune", itemId: 565, rate: 2, quantity: 200, category: "common" },
      { itemName: "Soul rune", itemId: 566, rate: 2, quantity: 150, category: "common" },
    ],
  },
  {
    bossName: "The Whisperer",
    killsPerHour: 15,
    drops: [
      { itemName: "Siren's staff", itemId: 28325, rate: 768, quantity: 1, category: "unique" },
      { itemName: "The Whisperer's eye", itemId: 28328, rate: 1536, quantity: 1, category: "unique" },
      { itemName: "Soul rune", itemId: 566, rate: 2, quantity: 200, category: "common" },
    ],
  },
  // New bosses
  {
    bossName: "Araxxor",
    killsPerHour: 15,
    drops: [
      { itemName: "Noxious pommel", itemId: 29370, rate: 200, quantity: 1, category: "unique" },
      { itemName: "Noxious point", itemId: 29372, rate: 200, quantity: 1, category: "unique" },
      { itemName: "Noxious blade", itemId: 29374, rate: 200, quantity: 1, category: "unique" },
      { itemName: "Araxyte fang", itemId: 29376, rate: 600, quantity: 1, category: "unique" },
      { itemName: "Araxyte venom sack", itemId: 29378, rate: 16, quantity: 1, category: "rare" },
    ],
  },
  {
    bossName: "Nex",
    killsPerHour: 12,
    drops: [
      { itemName: "Torva full helm", itemId: 26382, rate: 258, quantity: 1, category: "unique" },
      { itemName: "Torva platebody", itemId: 26384, rate: 258, quantity: 1, category: "unique" },
      { itemName: "Torva platelegs", itemId: 26386, rate: 258, quantity: 1, category: "unique" },
      { itemName: "Zaryte vambraces", itemId: 26235, rate: 172, quantity: 1, category: "unique" },
      { itemName: "Ancient hilt", itemId: 26233, rate: 258, quantity: 1, category: "unique" },
      { itemName: "Nihil horn", itemId: 26231, rate: 258, quantity: 1, category: "unique" },
    ],
  },
  {
    bossName: "Phantom Muspah",
    killsPerHour: 25,
    drops: [
      { itemName: "Ancient sceptre", itemId: 27624, rate: 100, quantity: 1, category: "unique" },
      { itemName: "Saturated heart", itemId: 27641, rate: 1024, quantity: 1, category: "unique" },
      { itemName: "Ancient essence", itemId: 27616, rate: 4, quantity: 150, category: "common" },
      { itemName: "Cannonball", itemId: 2, rate: 3, quantity: 400, category: "common" },
    ],
  },
  {
    bossName: "Kraken",
    killsPerHour: 55,
    drops: [
      { itemName: "Kraken tentacle", itemId: 12004, rate: 400, quantity: 1, category: "unique" },
      { itemName: "Trident of the seas (full)", itemId: 11905, rate: 512, quantity: 1, category: "unique" },
      { itemName: "Jar of dirt", itemId: 22520, rate: 1000, quantity: 1, category: "rare" },
    ],
  },
  {
    bossName: "Kalphite Queen",
    killsPerHour: 20,
    drops: [
      { itemName: "Dragon chainbody", itemId: 3140, rate: 128, quantity: 1, category: "unique" },
      { itemName: "Dragon 2h sword", itemId: 7158, rate: 256, quantity: 1, category: "unique" },
      { itemName: "Kq head", itemId: 7981, rate: 128, quantity: 1, category: "rare" },
    ],
  },
  {
    bossName: "Giant Mole",
    killsPerHour: 35,
    drops: [
      { itemName: "Mole claw", itemId: 7416, rate: 1, quantity: 1, category: "common" },
      { itemName: "Mole skin", itemId: 7418, rate: 1, quantity: 1, category: "common" },
      { itemName: "Long bone", itemId: 10976, rate: 400, quantity: 1, category: "rare" },
    ],
  },
  {
    bossName: "Dagannoth Rex",
    killsPerHour: 30,
    drops: [
      { itemName: "Berserker ring", itemId: 6737, rate: 128, quantity: 1, category: "unique" },
      { itemName: "Warrior ring", itemId: 6735, rate: 128, quantity: 1, category: "unique" },
      { itemName: "Dragon axe", itemId: 6739, rate: 128, quantity: 1, category: "unique" },
    ],
  },
  {
    bossName: "Dagannoth Prime",
    killsPerHour: 30,
    drops: [
      { itemName: "Seers ring", itemId: 6731, rate: 128, quantity: 1, category: "unique" },
      { itemName: "Mud battlestaff", itemId: 6562, rate: 128, quantity: 1, category: "unique" },
      { itemName: "Dragon axe", itemId: 6739, rate: 128, quantity: 1, category: "unique" },
    ],
  },
  {
    bossName: "Dagannoth Supreme",
    killsPerHour: 30,
    drops: [
      { itemName: "Archers ring", itemId: 6733, rate: 128, quantity: 1, category: "unique" },
      { itemName: "Seercull", itemId: 6724, rate: 128, quantity: 1, category: "unique" },
      { itemName: "Dragon axe", itemId: 6739, rate: 128, quantity: 1, category: "unique" },
    ],
  },
  {
    bossName: "The Nightmare",
    killsPerHour: 6,
    drops: [
      { itemName: "Inquisitor's mace", itemId: 24417, rate: 600, quantity: 1, category: "unique" },
      { itemName: "Inquisitor's great helm", itemId: 24419, rate: 600, quantity: 1, category: "unique" },
      { itemName: "Inquisitor's hauberk", itemId: 24420, rate: 600, quantity: 1, category: "unique" },
      { itemName: "Inquisitor's plateskirt", itemId: 24421, rate: 600, quantity: 1, category: "unique" },
      { itemName: "Nightmare staff", itemId: 24422, rate: 400, quantity: 1, category: "unique" },
      { itemName: "Eldritch orb", itemId: 24511, rate: 1800, quantity: 1, category: "unique" },
      { itemName: "Harmonised orb", itemId: 24514, rate: 1800, quantity: 1, category: "unique" },
      { itemName: "Volatile orb", itemId: 24517, rate: 1800, quantity: 1, category: "unique" },
    ],
  },
  {
    bossName: "Scurrius",
    killsPerHour: 30,
    drops: [
      { itemName: "Scurrius' spine", itemId: 28232, rate: 256, quantity: 1, category: "unique" },
      { itemName: "Scurry", itemId: 28229, rate: 3000, quantity: 1, category: "rare" },
    ],
  },
  {
    bossName: "Corrupted Gauntlet",
    killsPerHour: 5,
    drops: [
      { itemName: "Enhanced crystal weapon seed", itemId: 25859, rate: 400, quantity: 1, category: "unique" },
      { itemName: "Crystal armour seed", itemId: 23956, rate: 50, quantity: 1, category: "rare" },
      { itemName: "Crystal weapon seed", itemId: 23951, rate: 50, quantity: 1, category: "rare" },
    ],
  },
];
