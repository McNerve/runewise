export interface Monster {
  name: string;
  defLevel: number;
  defStab: number;
  defSlash: number;
  defCrush: number;
  defRanged: number;
  defMagic: number;
  hp: number;
}

export const MONSTERS: Monster[] = [
  { name: "Vorkath", defLevel: 214, defStab: 26, defSlash: 108, defCrush: 108, defRanged: 26, defMagic: 240, hp: 750 },
  { name: "Zulrah (Serpentine)", defLevel: 300, defStab: 50, defSlash: 50, defCrush: 50, defRanged: 50, defMagic: 300, hp: 500 },
  { name: "General Graardor", defLevel: 250, defStab: 90, defSlash: 90, defCrush: 90, defRanged: 90, defMagic: 0, hp: 255 },
  { name: "Commander Zilyana", defLevel: 300, defStab: 80, defSlash: 80, defCrush: 80, defRanged: 80, defMagic: 100, hp: 255 },
  { name: "K'ril Tsutsaroth", defLevel: 270, defStab: 20, defSlash: 20, defCrush: 20, defRanged: 20, defMagic: 0, hp: 255 },
  { name: "Kree'arra", defLevel: 260, defStab: 200, defSlash: 200, defCrush: 200, defRanged: 0, defMagic: 200, hp: 255 },
  { name: "Cerberus", defLevel: 100, defStab: 100, defSlash: 100, defCrush: 50, defRanged: 100, defMagic: 100, hp: 600 },
  { name: "Alchemical Hydra", defLevel: 100, defStab: 0, defSlash: 0, defCrush: 0, defRanged: 0, defMagic: 0, hp: 1100 },
  { name: "Corporeal Beast", defLevel: 310, defStab: 200, defSlash: 200, defCrush: 200, defRanged: 200, defMagic: 200, hp: 2000 },
  { name: "Abyssal Sire", defLevel: 250, defStab: 20, defSlash: 20, defCrush: 20, defRanged: 20, defMagic: 20, hp: 400 },
  { name: "Kalphite Queen (2nd form)", defLevel: 300, defStab: 0, defSlash: 0, defCrush: 0, defRanged: 300, defMagic: 0, hp: 255 },
  { name: "Thermonuclear Smoke Devil", defLevel: 150, defStab: 10, defSlash: 10, defCrush: 10, defRanged: 10, defMagic: 10, hp: 240 },
  { name: "Giant Mole", defLevel: 30, defStab: -10, defSlash: -10, defCrush: -10, defRanged: -10, defMagic: -10, hp: 200 },
  { name: "Dagannoth Rex", defLevel: 255, defStab: 255, defSlash: 255, defCrush: 255, defRanged: 255, defMagic: 0, hp: 255 },
  { name: "Custom target", defLevel: 1, defStab: 0, defSlash: 0, defCrush: 0, defRanged: 0, defMagic: 0, hp: 100 },
];
