export interface SkillPet {
  name: string;
  skill: string;
  icon: string;
  actions: { name: string; baseRate: number; xpPerAction: number }[];
}

export const SKILL_PETS: SkillPet[] = [
  {
    name: "Rock Golem", skill: "Mining", icon: "Rock_golem.png",
    actions: [
      { name: "Iron ore", baseRate: 741_600, xpPerAction: 35 },
      { name: "Amethyst", baseRate: 46_350, xpPerAction: 240 },
      { name: "Gem rocks", baseRate: 211_886, xpPerAction: 65 },
      { name: "Motherlode Mine (pay-dirt)", baseRate: 247_200, xpPerAction: 60 },
      { name: "Volcanic Mine", baseRate: 123_600, xpPerAction: 95 },
      { name: "Shooting Stars", baseRate: 74_160, xpPerAction: 60 },
    ],
  },
  {
    name: "Heron", skill: "Fishing", icon: "Heron.png",
    actions: [
      { name: "Shark", baseRate: 82_243, xpPerAction: 110 },
      { name: "Anglerfish", baseRate: 78_649, xpPerAction: 120 },
      { name: "Barbarian fishing", baseRate: 426_954, xpPerAction: 70 },
      { name: "Minnows", baseRate: 977_778, xpPerAction: 26.1 },
      { name: "Tempoross", baseRate: 168_000, xpPerAction: 65 },
    ],
  },
  {
    name: "Beaver", skill: "Woodcutting", icon: "Beaver.png",
    actions: [
      { name: "Yew trees", baseRate: 72_321, xpPerAction: 175 },
      { name: "Magic trees", baseRate: 72_321, xpPerAction: 250 },
      { name: "Redwood trees", baseRate: 72_321, xpPerAction: 380 },
      { name: "Teak trees", baseRate: 108_482, xpPerAction: 85 },
    ],
  },
  {
    name: "Baby Chinchompa", skill: "Hunter", icon: "Baby_chinchompa.png",
    actions: [
      { name: "Red chinchompas", baseRate: 131_395, xpPerAction: 265 },
      { name: "Black chinchompas", baseRate: 131_395, xpPerAction: 315 },
      { name: "Herbiboar", baseRate: 6_570, xpPerAction: 1950 },
    ],
  },
  {
    name: "Giant Squirrel", skill: "Agility", icon: "Giant_squirrel.png",
    actions: [
      { name: "Canifis course", baseRate: 36_842, xpPerAction: 240 },
      { name: "Seers' Village", baseRate: 35_205, xpPerAction: 570 },
      { name: "Ardougne course", baseRate: 34_440, xpPerAction: 793 },
      { name: "Hallowed Sepulchre (floor 5)", baseRate: 1_000, xpPerAction: 1200 },
    ],
  },
  {
    name: "Tangleroot", skill: "Farming", icon: "Tangleroot.png",
    actions: [
      { name: "Magic tree", baseRate: 9_368, xpPerAction: 13768 },
      { name: "Palm tree", baseRate: 9_000, xpPerAction: 10150 },
      { name: "Herb patch", baseRate: 98_364, xpPerAction: 27 },
      { name: "Hespori", baseRate: 65, xpPerAction: 12600 },
    ],
  },
  {
    name: "Rocky", skill: "Thieving", icon: "Rocky.png",
    actions: [
      { name: "Knights of Ardougne", baseRate: 257_211, xpPerAction: 132.5 },
      { name: "Elves", baseRate: 99_175, xpPerAction: 353 },
      { name: "Blackjacking", baseRate: 257_211, xpPerAction: 160 },
    ],
  },
  {
    name: "Rift Guardian", skill: "Runecraft", icon: "Rift_guardian.png",
    actions: [
      { name: "Blood runes", baseRate: 1_487_213, xpPerAction: 24 },
      { name: "Lava runes", baseRate: 1_487_213, xpPerAction: 26 },
      { name: "GOTR (per reward)", baseRate: 2_227, xpPerAction: 55 },
    ],
  },
  {
    name: "Phoenix", skill: "Firemaking", icon: "Phoenix_pet.png",
    actions: [
      { name: "Wintertodt (500+ points)", baseRate: 5_000, xpPerAction: 100 },
      { name: "Redwood logs", baseRate: 5_000_000, xpPerAction: 350 },
    ],
  },
  {
    name: "Smolcano", skill: "Mining", icon: "Smolcano.png",
    actions: [
      { name: "Zalcano kill", baseRate: 2_250, xpPerAction: 0 },
    ],
  },
];
