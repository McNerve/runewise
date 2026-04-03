export interface Prayer {
  name: string;
  attackMult: number;
  strengthMult: number;
  style: "melee" | "ranged" | "magic";
  icon?: string; // wiki image filename
  level?: number;
}

export const PRAYERS: Prayer[] = [
  // Melee
  { name: "None", attackMult: 1, strengthMult: 1, style: "melee" },
  { name: "Clarity of Thought", attackMult: 1.05, strengthMult: 1, style: "melee", icon: "Clarity_of_Thought_icon.png", level: 7 },
  { name: "Improved Reflexes", attackMult: 1.1, strengthMult: 1, style: "melee", icon: "Improved_Reflexes_icon.png", level: 16 },
  { name: "Incredible Reflexes", attackMult: 1.15, strengthMult: 1, style: "melee", icon: "Incredible_Reflexes_icon.png", level: 34 },
  { name: "Burst of Strength", attackMult: 1, strengthMult: 1.05, style: "melee", icon: "Burst_of_Strength_icon.png", level: 4 },
  { name: "Superhuman Strength", attackMult: 1, strengthMult: 1.1, style: "melee", icon: "Superhuman_Strength_icon.png", level: 13 },
  { name: "Ultimate Strength", attackMult: 1, strengthMult: 1.15, style: "melee", icon: "Ultimate_Strength_icon.png", level: 31 },
  { name: "Chivalry", attackMult: 1.15, strengthMult: 1.18, style: "melee", icon: "Chivalry_icon.png", level: 60 },
  { name: "Piety", attackMult: 1.2, strengthMult: 1.23, style: "melee", icon: "Piety_icon.png", level: 70 },
  // Ranged
  { name: "Sharp Eye", attackMult: 1.05, strengthMult: 1.05, style: "ranged", icon: "Sharp_Eye_icon.png", level: 8 },
  { name: "Hawk Eye", attackMult: 1.1, strengthMult: 1.1, style: "ranged", icon: "Hawk_Eye_icon.png", level: 26 },
  { name: "Eagle Eye", attackMult: 1.15, strengthMult: 1.15, style: "ranged", icon: "Eagle_Eye_icon.png", level: 44 },
  { name: "Rigour", attackMult: 1.2, strengthMult: 1.23, style: "ranged", icon: "Rigour_icon.png", level: 74 },
  // Magic
  { name: "Mystic Will", attackMult: 1.05, strengthMult: 1, style: "magic", icon: "Mystic_Will_icon.png", level: 9 },
  { name: "Mystic Lore", attackMult: 1.1, strengthMult: 1, style: "magic", icon: "Mystic_Lore_icon.png", level: 27 },
  { name: "Mystic Might", attackMult: 1.15, strengthMult: 1, style: "magic", icon: "Mystic_Might_icon.png", level: 45 },
  { name: "Augury", attackMult: 1.25, strengthMult: 1, style: "magic", icon: "Augury_icon.png", level: 77 },
];
