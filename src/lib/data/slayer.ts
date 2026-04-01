export interface SlayerTask {
  monster: string;
  amount: string;
  weight: number;
  slayerLevel: number;
  combatLevel: number;
  unlockCost?: number;
  unlockName?: string;
}

export interface SlayerMaster {
  name: string;
  combatRequired: number;
  slayerRequired: number;
  location: string;
  tasks: SlayerTask[];
}

export const SLAYER_MASTERS: SlayerMaster[] = [
  {
    name: "Duradel",
    combatRequired: 100,
    slayerRequired: 50,
    location: "Shilo Village",
    tasks: [
      { monster: "Abyssal demons", amount: "130-200", weight: 12, slayerLevel: 85, combatLevel: 100 },
      { monster: "Adamant dragons", amount: "4-9", weight: 2, slayerLevel: 1, combatLevel: 100 },
      { monster: "Aviansies", amount: "120-200", weight: 8, slayerLevel: 1, combatLevel: 100 },
      { monster: "Black demons", amount: "130-200", weight: 8, slayerLevel: 1, combatLevel: 100 },
      { monster: "Black dragons", amount: "10-20", weight: 9, slayerLevel: 1, combatLevel: 100 },
      { monster: "Bloodveld", amount: "130-200", weight: 8, slayerLevel: 50, combatLevel: 100 },
      { monster: "Blue dragons", amount: "110-170", weight: 4, slayerLevel: 1, combatLevel: 100 },
      { monster: "Cave horrors", amount: "130-200", weight: 4, slayerLevel: 58, combatLevel: 100 },
      { monster: "Cave kraken", amount: "100-120", weight: 9, slayerLevel: 87, combatLevel: 100 },
      { monster: "Dagannoth", amount: "130-200", weight: 9, slayerLevel: 1, combatLevel: 100 },
      { monster: "Dark beasts", amount: "10-20", weight: 11, slayerLevel: 90, combatLevel: 100 },
      { monster: "Drake", amount: "50-110", weight: 8, slayerLevel: 84, combatLevel: 100 },
      { monster: "Dust devils", amount: "130-200", weight: 5, slayerLevel: 65, combatLevel: 100 },
      { monster: "Fire giants", amount: "130-200", weight: 7, slayerLevel: 1, combatLevel: 100 },
      { monster: "Fossil Island wyverns", amount: "20-60", weight: 5, slayerLevel: 66, combatLevel: 100 },
      { monster: "Gargoyles", amount: "130-200", weight: 8, slayerLevel: 75, combatLevel: 100 },
      { monster: "Greater demons", amount: "130-200", weight: 9, slayerLevel: 1, combatLevel: 100 },
      { monster: "Hellhounds", amount: "130-200", weight: 10, slayerLevel: 1, combatLevel: 100 },
      { monster: "Hydras", amount: "130-200", weight: 10, slayerLevel: 95, combatLevel: 100 },
      { monster: "Iron dragons", amount: "40-60", weight: 5, slayerLevel: 1, combatLevel: 100 },
      { monster: "Kalphite", amount: "130-200", weight: 9, slayerLevel: 1, combatLevel: 100 },
      { monster: "Kurask", amount: "130-200", weight: 4, slayerLevel: 70, combatLevel: 100 },
      { monster: "Nechryael", amount: "130-200", weight: 9, slayerLevel: 80, combatLevel: 100 },
      { monster: "Red dragons", amount: "30-80", weight: 8, slayerLevel: 1, combatLevel: 100 },
      { monster: "Rune dragons", amount: "3-8", weight: 2, slayerLevel: 1, combatLevel: 100 },
      { monster: "Skeletal wyverns", amount: "20-40", weight: 7, slayerLevel: 72, combatLevel: 100 },
      { monster: "Smoke devils", amount: "130-200", weight: 9, slayerLevel: 93, combatLevel: 100 },
      { monster: "Steel dragons", amount: "10-20", weight: 7, slayerLevel: 1, combatLevel: 100 },
      { monster: "Suqah", amount: "60-90", weight: 8, slayerLevel: 1, combatLevel: 100 },
      { monster: "Trolls", amount: "130-200", weight: 6, slayerLevel: 1, combatLevel: 100 },
      { monster: "TzHaar", amount: "130-200", weight: 10, slayerLevel: 1, combatLevel: 100 },
      { monster: "Waterfiends", amount: "130-200", weight: 2, slayerLevel: 1, combatLevel: 100 },
      { monster: "Wyrms", amount: "130-200", weight: 8, slayerLevel: 62, combatLevel: 100 },
    ],
  },
  {
    name: "Nieve / Steve",
    combatRequired: 85,
    slayerRequired: 1,
    location: "Tree Gnome Stronghold",
    tasks: [
      { monster: "Abyssal demons", amount: "130-200", weight: 12, slayerLevel: 85, combatLevel: 85 },
      { monster: "Aviansies", amount: "120-200", weight: 8, slayerLevel: 1, combatLevel: 85 },
      { monster: "Black demons", amount: "130-200", weight: 8, slayerLevel: 1, combatLevel: 85 },
      { monster: "Bloodveld", amount: "130-200", weight: 8, slayerLevel: 50, combatLevel: 85 },
      { monster: "Cave kraken", amount: "100-120", weight: 9, slayerLevel: 87, combatLevel: 85 },
      { monster: "Dagannoth", amount: "130-200", weight: 9, slayerLevel: 1, combatLevel: 85 },
      { monster: "Dust devils", amount: "130-200", weight: 5, slayerLevel: 65, combatLevel: 85 },
      { monster: "Fire giants", amount: "130-200", weight: 7, slayerLevel: 1, combatLevel: 85 },
      { monster: "Gargoyles", amount: "130-200", weight: 8, slayerLevel: 75, combatLevel: 85 },
      { monster: "Greater demons", amount: "130-200", weight: 9, slayerLevel: 1, combatLevel: 85 },
      { monster: "Hellhounds", amount: "130-200", weight: 10, slayerLevel: 1, combatLevel: 85 },
      { monster: "Kalphite", amount: "130-200", weight: 9, slayerLevel: 1, combatLevel: 85 },
      { monster: "Kurask", amount: "130-200", weight: 4, slayerLevel: 70, combatLevel: 85 },
      { monster: "Nechryael", amount: "130-200", weight: 9, slayerLevel: 80, combatLevel: 85 },
      { monster: "Trolls", amount: "130-200", weight: 6, slayerLevel: 1, combatLevel: 85 },
    ],
  },
];
