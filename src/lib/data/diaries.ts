export interface DiaryRequirement {
  skill: string;
  level: number;
}

export interface DiaryTier {
  tier: "Easy" | "Medium" | "Hard" | "Elite";
  requirements: DiaryRequirement[];
  rewards: string[];
}

export interface DiaryRegion {
  name: string;
  tiers: DiaryTier[];
}

export const DIARY_REGIONS: DiaryRegion[] = [
  {
    name: "Ardougne",
    tiers: [
      { tier: "Easy", requirements: [{ skill: "Thieving", level: 5 }], rewards: ["Ardougne cloak 1"] },
      { tier: "Medium", requirements: [{ skill: "Thieving", level: 38 }, { skill: "Agility", level: 39 }, { skill: "Ranged", level: 21 }, { skill: "Strength", level: 38 }], rewards: ["Ardougne cloak 2 — 100% Thieving success on Ardougne cake stall"] },
      { tier: "Hard", requirements: [{ skill: "Thieving", level: 72 }, { skill: "Construction", level: 50 }, { skill: "Farming", level: 70 }, { skill: "Agility", level: 56 }, { skill: "Crafting", level: 50 }, { skill: "Fletching", level: 69 }, { skill: "Magic", level: 66 }, { skill: "Smithing", level: 68 }, { skill: "Strength", level: 50 }], rewards: ["Ardougne cloak 3 — unlimited farm teleport"] },
      { tier: "Elite", requirements: [{ skill: "Thieving", level: 82 }, { skill: "Agility", level: 90 }, { skill: "Cooking", level: 91 }, { skill: "Crafting", level: 85 }, { skill: "Farming", level: 85 }, { skill: "Fletching", level: 69 }, { skill: "Magic", level: 94 }, { skill: "Smithing", level: 91 }], rewards: ["Ardougne cloak 4 — 10% increased Thieving success rate everywhere"] },
    ],
  },
  {
    name: "Desert",
    tiers: [
      { tier: "Easy", requirements: [{ skill: "Hunter", level: 5 }], rewards: ["Desert amulet 1"] },
      { tier: "Medium", requirements: [{ skill: "Agility", level: 30 }, { skill: "Attack", level: 50 }, { skill: "Crafting", level: 45 }, { skill: "Firemaking", level: 45 }, { skill: "Hunter", level: 47 }, { skill: "Magic", level: 39 }, { skill: "Mining", level: 37 }, { skill: "Slayer", level: 22 }, { skill: "Smithing", level: 30 }, { skill: "Thieving", level: 37 }], rewards: ["Desert amulet 2"] },
      { tier: "Hard", requirements: [{ skill: "Agility", level: 70 }, { skill: "Construction", level: 55 }, { skill: "Crafting", level: 61 }, { skill: "Firemaking", level: 60 }, { skill: "Magic", level: 68 }, { skill: "Mining", level: 55 }, { skill: "Prayer", level: 55 }, { skill: "Slayer", level: 65 }, { skill: "Smithing", level: 68 }, { skill: "Thieving", level: 65 }], rewards: ["Desert amulet 3 — Nardah altar restores prayer + heals"] },
      { tier: "Elite", requirements: [{ skill: "Construction", level: 78 }, { skill: "Crafting", level: 85 }, { skill: "Magic", level: 94 }, { skill: "Prayer", level: 85 }, { skill: "Thieving", level: 91 }], rewards: ["Desert amulet 4 — unlimited teleport to Nardah, Kalphite Cave shortcut"] },
    ],
  },
  {
    name: "Falador",
    tiers: [
      { tier: "Easy", requirements: [{ skill: "Agility", level: 5 }, { skill: "Mining", level: 10 }], rewards: ["Falador shield 1"] },
      { tier: "Medium", requirements: [{ skill: "Agility", level: 42 }, { skill: "Crafting", level: 40 }, { skill: "Defence", level: 20 }, { skill: "Farming", level: 23 }, { skill: "Firemaking", level: 49 }, { skill: "Mining", level: 40 }, { skill: "Prayer", level: 10 }, { skill: "Slayer", level: 32 }, { skill: "Strength", level: 37 }], rewards: ["Falador shield 2 — charge Mole locator"] },
      { tier: "Hard", requirements: [{ skill: "Agility", level: 59 }, { skill: "Crafting", level: 72 }, { skill: "Defence", level: 50 }, { skill: "Farming", level: 45 }, { skill: "Herblore", level: 52 }, { skill: "Mining", level: 60 }, { skill: "Prayer", level: 70 }, { skill: "Runecraft", level: 56 }, { skill: "Slayer", level: 72 }, { skill: "Strength", level: 56 }, { skill: "Thieving", level: 58 }], rewards: ["Falador shield 3 — Giant Mole locator"] },
      { tier: "Elite", requirements: [{ skill: "Agility", level: 80 }, { skill: "Farming", level: 91 }, { skill: "Herblore", level: 81 }, { skill: "Mining", level: 89 }, { skill: "Prayer", level: 70 }, { skill: "Runecraft", level: 88 }, { skill: "Slayer", level: 72 }, { skill: "Thieving", level: 58 }], rewards: ["Falador shield 4 — noted Giant Mole skins/claws"] },
    ],
  },
  {
    name: "Fremennik",
    tiers: [
      { tier: "Easy", requirements: [{ skill: "Crafting", level: 23 }, { skill: "Hunter", level: 11 }], rewards: ["Fremennik sea boots 1"] },
      { tier: "Medium", requirements: [{ skill: "Construction", level: 37 }, { skill: "Hunter", level: 35 }, { skill: "Mining", level: 40 }, { skill: "Slayer", level: 47 }, { skill: "Smithing", level: 50 }, { skill: "Thieving", level: 42 }], rewards: ["Fremennik sea boots 2"] },
      { tier: "Hard", requirements: [{ skill: "Agility", level: 32 }, { skill: "Construction", level: 37 }, { skill: "Crafting", level: 61 }, { skill: "Defence", level: 70 }, { skill: "Firemaking", level: 49 }, { skill: "Hunter", level: 55 }, { skill: "Magic", level: 72 }, { skill: "Mining", level: 70 }, { skill: "Smithing", level: 60 }, { skill: "Thieving", level: 75 }], rewards: ["Fremennik sea boots 3 — Peer the Seer bank"] },
      { tier: "Elite", requirements: [{ skill: "Agility", level: 80 }, { skill: "Crafting", level: 80 }, { skill: "Hitpoints", level: 70 }, { skill: "Magic", level: 72 }, { skill: "Runecraft", level: 82 }, { skill: "Slayer", level: 83 }, { skill: "Woodcutting", level: 85 }], rewards: ["Fremennik sea boots 4 — DKS noted bones, Aviansie noted addy bars"] },
    ],
  },
  {
    name: "Kandarin",
    tiers: [
      { tier: "Easy", requirements: [{ skill: "Agility", level: 20 }, { skill: "Fishing", level: 16 }], rewards: ["Kandarin headgear 1"] },
      { tier: "Medium", requirements: [{ skill: "Agility", level: 36 }, { skill: "Cooking", level: 43 }, { skill: "Farming", level: 26 }, { skill: "Fishing", level: 46 }, { skill: "Fletching", level: 50 }, { skill: "Magic", level: 45 }, { skill: "Mining", level: 30 }, { skill: "Strength", level: 22 }, { skill: "Thieving", level: 47 }], rewards: ["Kandarin headgear 2 — 10% more marks at Seers"] },
      { tier: "Hard", requirements: [{ skill: "Agility", level: 60 }, { skill: "Construction", level: 50 }, { skill: "Crafting", level: 65 }, { skill: "Farming", level: 79 }, { skill: "Firemaking", level: 65 }, { skill: "Fishing", level: 70 }, { skill: "Fletching", level: 70 }, { skill: "Prayer", level: 70 }, { skill: "Smithing", level: 75 }, { skill: "Thieving", level: 53 }, { skill: "Woodcutting", level: 60 }], rewards: ["Kandarin headgear 3 — 15% more marks at Seers"] },
      { tier: "Elite", requirements: [{ skill: "Agility", level: 60 }, { skill: "Cooking", level: 80 }, { skill: "Crafting", level: 85 }, { skill: "Farming", level: 79 }, { skill: "Firemaking", level: 85 }, { skill: "Fishing", level: 76 }, { skill: "Magic", level: 87 }, { skill: "Smithing", level: 90 }], rewards: ["Kandarin headgear 4 — 33% chance to save bolt tips"] },
    ],
  },
  {
    name: "Karamja",
    tiers: [
      { tier: "Easy", requirements: [{ skill: "Agility", level: 15 }, { skill: "Mining", level: 40 }], rewards: ["Karamja gloves 1"] },
      { tier: "Medium", requirements: [{ skill: "Agility", level: 12 }, { skill: "Cooking", level: 16 }, { skill: "Farming", level: 27 }, { skill: "Fishing", level: 65 }, { skill: "Hunter", level: 41 }, { skill: "Mining", level: 40 }, { skill: "Woodcutting", level: 50 }], rewards: ["Karamja gloves 2 — Brimhaven Dungeon shortcut"] },
      { tier: "Hard", requirements: [{ skill: "Agility", level: 53 }, { skill: "Cooking", level: 53 }, { skill: "Mining", level: 52 }, { skill: "Ranged", level: 42 }, { skill: "Runecraft", level: 44 }, { skill: "Smithing", level: 50 }, { skill: "Strength", level: 50 }, { skill: "Thieving", level: 50 }, { skill: "Woodcutting", level: 34 }], rewards: ["Karamja gloves 3 — free access to Brimhaven Dungeon"] },
      { tier: "Elite", requirements: [{ skill: "Agility", level: 53 }, { skill: "Cooking", level: 53 }, { skill: "Farming", level: 72 }, { skill: "Herblore", level: 87 }, { skill: "Runecraft", level: 91 }, { skill: "Woodcutting", level: 34 }], rewards: ["Karamja gloves 4 — unlimited Gem Mine teleport, 10% more Tokkul"] },
    ],
  },
  {
    name: "Kourend & Kebos",
    tiers: [
      { tier: "Easy", requirements: [{ skill: "Mining", level: 15 }, { skill: "Thieving", level: 25 }], rewards: ["Rada's blessing 1"] },
      { tier: "Medium", requirements: [{ skill: "Agility", level: 49 }, { skill: "Crafting", level: 30 }, { skill: "Farming", level: 45 }, { skill: "Firemaking", level: 50 }, { skill: "Fishing", level: 43 }, { skill: "Hunter", level: 53 }, { skill: "Mining", level: 42 }, { skill: "Smithing", level: 40 }, { skill: "Woodcutting", level: 50 }], rewards: ["Rada's blessing 2 — 4% increased Fishing at Kourend"] },
      { tier: "Hard", requirements: [{ skill: "Crafting", level: 38 }, { skill: "Farming", level: 74 }, { skill: "Fishing", level: 62 }, { skill: "Hunter", level: 60 }, { skill: "Magic", level: 67 }, { skill: "Mining", level: 65 }, { skill: "Prayer", level: 77 }, { skill: "Slayer", level: 62 }, { skill: "Smithing", level: 70 }, { skill: "Thieving", level: 49 }, { skill: "Woodcutting", level: 60 }], rewards: ["Rada's blessing 3 — 6% increased Fishing at Kourend"] },
      { tier: "Elite", requirements: [{ skill: "Cooking", level: 84 }, { skill: "Crafting", level: 38 }, { skill: "Farming", level: 74 }, { skill: "Fishing", level: 82 }, { skill: "Magic", level: 90 }, { skill: "Mining", level: 38 }, { skill: "Runecraft", level: 77 }, { skill: "Slayer", level: 95 }, { skill: "Woodcutting", level: 90 }], rewards: ["Rada's blessing 4 — 8% increased Fishing, unlimited Kourend teleport"] },
    ],
  },
  {
    name: "Lumbridge & Draynor",
    tiers: [
      { tier: "Easy", requirements: [{ skill: "Agility", level: 10 }, { skill: "Firemaking", level: 15 }, { skill: "Mining", level: 15 }, { skill: "Runecraft", level: 5 }, { skill: "Slayer", level: 7 }], rewards: ["Explorer's ring 1 — Run energy restore"] },
      { tier: "Medium", requirements: [{ skill: "Agility", level: 20 }, { skill: "Crafting", level: 38 }, { skill: "Fishing", level: 30 }, { skill: "Hunter", level: 50 }, { skill: "Magic", level: 31 }, { skill: "Ranged", level: 50 }, { skill: "Runecraft", level: 23 }, { skill: "Strength", level: 19 }, { skill: "Woodcutting", level: 36 }], rewards: ["Explorer's ring 2 — 50% Tears of Guthix bonus"] },
      { tier: "Hard", requirements: [{ skill: "Agility", level: 46 }, { skill: "Crafting", level: 70 }, { skill: "Firemaking", level: 65 }, { skill: "Magic", level: 60 }, { skill: "Prayer", level: 52 }, { skill: "Runecraft", level: 59 }, { skill: "Smithing", level: 68 }, { skill: "Strength", level: 50 }, { skill: "Woodcutting", level: 57 }], rewards: ["Explorer's ring 3 — unlimited cabbage port"] },
      { tier: "Elite", requirements: [{ skill: "Agility", level: 70 }, { skill: "Farming", level: 63 }, { skill: "Firemaking", level: 75 }, { skill: "Magic", level: 75 }, { skill: "Runecraft", level: 76 }, { skill: "Smithing", level: 88 }, { skill: "Strength", level: 70 }, { skill: "Woodcutting", level: 75 }], rewards: ["Explorer's ring 4 — unlimited run energy restores"] },
    ],
  },
  {
    name: "Morytania",
    tiers: [
      { tier: "Easy", requirements: [{ skill: "Cooking", level: 12 }, { skill: "Crafting", level: 15 }, { skill: "Slayer", level: 15 }], rewards: ["Morytania legs 1"] },
      { tier: "Medium", requirements: [{ skill: "Agility", level: 42 }, { skill: "Cooking", level: 40 }, { skill: "Farming", level: 53 }, { skill: "Hunter", level: 29 }, { skill: "Magic", level: 50 }, { skill: "Mining", level: 55 }, { skill: "Slayer", level: 42 }, { skill: "Smithing", level: 50 }, { skill: "Woodcutting", level: 45 }], rewards: ["Morytania legs 2 — 50% more Fungi in Mort Myre"] },
      { tier: "Hard", requirements: [{ skill: "Agility", level: 71 }, { skill: "Construction", level: 50 }, { skill: "Defence", level: 70 }, { skill: "Farming", level: 53 }, { skill: "Firemaking", level: 50 }, { skill: "Magic", level: 66 }, { skill: "Mining", level: 55 }, { skill: "Prayer", level: 70 }, { skill: "Slayer", level: 58 }, { skill: "Smithing", level: 50 }, { skill: "Woodcutting", level: 50 }], rewards: ["Morytania legs 3 — double Mort Myre fungi, bonecrusher"] },
      { tier: "Elite", requirements: [{ skill: "Crafting", level: 84 }, { skill: "Defence", level: 70 }, { skill: "Farming", level: 85 }, { skill: "Firemaking", level: 80 }, { skill: "Fishing", level: 96 }, { skill: "Magic", level: 83 }, { skill: "Mining", level: 70 }, { skill: "Prayer", level: 70 }, { skill: "Slayer", level: 85 }, { skill: "Woodcutting", level: 75 }], rewards: ["Morytania legs 4 — 50% more Barrows runes, Robin shortcut"] },
    ],
  },
  {
    name: "Varrock",
    tiers: [
      { tier: "Easy", requirements: [{ skill: "Agility", level: 13 }, { skill: "Crafting", level: 8 }, { skill: "Mining", level: 15 }, { skill: "Runecraft", level: 9 }, { skill: "Thieving", level: 5 }], rewards: ["Varrock armour 1 — 10% chance double ore to Mithril"] },
      { tier: "Medium", requirements: [{ skill: "Agility", level: 30 }, { skill: "Crafting", level: 36 }, { skill: "Farming", level: 30 }, { skill: "Firemaking", level: 40 }, { skill: "Hunter", level: 31 }, { skill: "Magic", level: 25 }, { skill: "Prayer", level: 52 }, { skill: "Thieving", level: 25 }], rewards: ["Varrock armour 2 — 10% chance double ore to Adamant"] },
      { tier: "Hard", requirements: [{ skill: "Agility", level: 51 }, { skill: "Construction", level: 50 }, { skill: "Crafting", level: 36 }, { skill: "Farming", level: 68 }, { skill: "Firemaking", level: 60 }, { skill: "Hunter", level: 66 }, { skill: "Magic", level: 54 }, { skill: "Prayer", level: 52 }, { skill: "Ranged", level: 40 }, { skill: "Thieving", level: 53 }], rewards: ["Varrock armour 3 — 10% chance double ore to Runite, GE discount"] },
      { tier: "Elite", requirements: [{ skill: "Cooking", level: 95 }, { skill: "Crafting", level: 36 }, { skill: "Farming", level: 68 }, { skill: "Firemaking", level: 60 }, { skill: "Herblore", level: 90 }, { skill: "Magic", level: 86 }], rewards: ["Varrock armour 4 — 10% chance double ore anywhere, extra Battlestaves"] },
    ],
  },
  {
    name: "Western Provinces",
    tiers: [
      { tier: "Easy", requirements: [{ skill: "Fletching", level: 5 }, { skill: "Hunter", level: 9 }, { skill: "Mining", level: 15 }], rewards: ["Western banner 1"] },
      { tier: "Medium", requirements: [{ skill: "Agility", level: 37 }, { skill: "Cooking", level: 42 }, { skill: "Farming", level: 46 }, { skill: "Firemaking", level: 35 }, { skill: "Fishing", level: 46 }, { skill: "Hunter", level: 31 }, { skill: "Mining", level: 40 }, { skill: "Ranged", level: 30 }, { skill: "Woodcutting", level: 35 }], rewards: ["Western banner 2"] },
      { tier: "Hard", requirements: [{ skill: "Agility", level: 56 }, { skill: "Construction", level: 65 }, { skill: "Farming", level: 68 }, { skill: "Firemaking", level: 50 }, { skill: "Fishing", level: 62 }, { skill: "Fletching", level: 5 }, { skill: "Hunter", level: 69 }, { skill: "Magic", level: 64 }, { skill: "Mining", level: 70 }, { skill: "Ranged", level: 70 }, { skill: "Thieving", level: 75 }, { skill: "Woodcutting", level: 50 }], rewards: ["Western banner 3 — Crystal Saw + Halberd, Dark Beast shortcut"] },
      { tier: "Elite", requirements: [{ skill: "Agility", level: 85 }, { skill: "Attack", level: 42 }, { skill: "Farming", level: 75 }, { skill: "Fletching", level: 5 }, { skill: "Hunter", level: 80 }, { skill: "Magic", level: 75 }, { skill: "Mining", level: 70 }, { skill: "Ranged", level: 70 }, { skill: "Slayer", level: 93 }, { skill: "Thieving", level: 85 }], rewards: ["Western banner 4 — unlimited Zulrah teleport, 150 Crystal Shards/day"] },
    ],
  },
  {
    name: "Wilderness",
    tiers: [
      { tier: "Easy", requirements: [{ skill: "Agility", level: 15 }, { skill: "Magic", level: 21 }, { skill: "Mining", level: 15 }], rewards: ["Wilderness sword 1"] },
      { tier: "Medium", requirements: [{ skill: "Agility", level: 60 }, { skill: "Magic", level: 60 }, { skill: "Mining", level: 55 }, { skill: "Slayer", level: 50 }, { skill: "Smithing", level: 50 }, { skill: "Strength", level: 60 }, { skill: "Woodcutting", level: 61 }], rewards: ["Wilderness sword 2"] },
      { tier: "Hard", requirements: [{ skill: "Agility", level: 64 }, { skill: "Fishing", level: 53 }, { skill: "Hunter", level: 67 }, { skill: "Magic", level: 66 }, { skill: "Mining", level: 75 }, { skill: "Slayer", level: 68 }, { skill: "Smithing", level: 75 }, { skill: "Woodcutting", level: 61 }], rewards: ["Wilderness sword 3 — noted dragon bones from Lava Dragons"] },
      { tier: "Elite", requirements: [{ skill: "Agility", level: 60 }, { skill: "Cooking", level: 90 }, { skill: "Fishing", level: 85 }, { skill: "Magic", level: 96 }, { skill: "Mining", level: 85 }, { skill: "Slayer", level: 83 }, { skill: "Smithing", level: 90 }, { skill: "Thieving", level: 84 }], rewards: ["Wilderness sword 4 — unlimited Fountain of Rune teleport"] },
    ],
  },
];
