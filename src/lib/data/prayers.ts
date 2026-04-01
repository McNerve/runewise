export interface Prayer {
  name: string;
  attackMult: number;
  strengthMult: number;
  style: "melee" | "ranged" | "magic";
}

export const PRAYERS: Prayer[] = [
  // Melee
  { name: "None", attackMult: 1, strengthMult: 1, style: "melee" },
  { name: "Clarity of Thought", attackMult: 1.05, strengthMult: 1, style: "melee" },
  { name: "Improved Reflexes", attackMult: 1.1, strengthMult: 1, style: "melee" },
  { name: "Incredible Reflexes", attackMult: 1.15, strengthMult: 1, style: "melee" },
  { name: "Burst of Strength", attackMult: 1, strengthMult: 1.05, style: "melee" },
  { name: "Superhuman Strength", attackMult: 1, strengthMult: 1.1, style: "melee" },
  { name: "Ultimate Strength", attackMult: 1, strengthMult: 1.15, style: "melee" },
  { name: "Chivalry", attackMult: 1.15, strengthMult: 1.18, style: "melee" },
  { name: "Piety", attackMult: 1.2, strengthMult: 1.23, style: "melee" },
  // Ranged
  { name: "Sharp Eye", attackMult: 1.05, strengthMult: 1.05, style: "ranged" },
  { name: "Hawk Eye", attackMult: 1.1, strengthMult: 1.1, style: "ranged" },
  { name: "Eagle Eye", attackMult: 1.15, strengthMult: 1.15, style: "ranged" },
  { name: "Rigour", attackMult: 1.2, strengthMult: 1.23, style: "ranged" },
  // Magic
  { name: "Mystic Might", attackMult: 1.15, strengthMult: 1, style: "magic" },
  { name: "Augury", attackMult: 1.25, strengthMult: 1, style: "magic" },
];
