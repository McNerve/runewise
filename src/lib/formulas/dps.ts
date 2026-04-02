export interface DpsInput {
  attackLevel: number;
  strengthLevel: number;
  rangedLevel: number;
  magicLevel: number;
  attackBonus: number;
  strengthBonus: number;
  prayerAttackMult: number;
  prayerStrengthMult: number;
  stanceAttackBonus: number;
  stanceStrengthBonus: number;
  attackSpeed: number;
  combatStyle: "melee" | "ranged" | "magic";
  targetDefLevel: number;
  targetDefBonus: number;
  targetHp: number;
  targetMagicLevel?: number;
  modifiers?: DpsModifier[];
}

export interface DpsModifier {
  id: string;
  name: string;
  accuracyMult: number;
  damageMult: number;
  condition?: string;
}

export const DPS_MODIFIERS: Record<string, DpsModifier> = {
  void_melee: {
    id: "void_melee",
    name: "Void Knight (melee)",
    accuracyMult: 1.10,
    damageMult: 1.10,
    condition: "melee",
  },
  void_ranged: {
    id: "void_ranged",
    name: "Void Knight (ranged)",
    accuracyMult: 1.10,
    damageMult: 1.10,
    condition: "ranged",
  },
  elite_void_ranged: {
    id: "elite_void_ranged",
    name: "Elite Void (ranged)",
    accuracyMult: 1.10,
    damageMult: 1.125,
    condition: "ranged",
  },
  void_magic: {
    id: "void_magic",
    name: "Void Knight (magic)",
    accuracyMult: 1.45,
    damageMult: 1.0,
    condition: "magic",
  },
  elite_void_magic: {
    id: "elite_void_magic",
    name: "Elite Void (magic)",
    accuracyMult: 1.45,
    damageMult: 1.025,
    condition: "magic",
  },
  slayer_helm: {
    id: "slayer_helm",
    name: "Slayer helm (i)",
    accuracyMult: 7 / 6,
    damageMult: 7 / 6,
  },
  salve_e: {
    id: "salve_e",
    name: "Salve amulet (e)",
    accuracyMult: 1.20,
    damageMult: 1.20,
  },
  salve_ei: {
    id: "salve_ei",
    name: "Salve amulet (ei)",
    accuracyMult: 1.20,
    damageMult: 1.20,
  },
  arclight: {
    id: "arclight",
    name: "Arclight",
    accuracyMult: 1.70,
    damageMult: 1.70,
    condition: "melee",
  },
  dhcb: {
    id: "dhcb",
    name: "Dragon hunter crossbow",
    accuracyMult: 1.30,
    damageMult: 1.25,
    condition: "ranged",
  },
  dhl: {
    id: "dhl",
    name: "Dragon hunter lance",
    accuracyMult: 1.20,
    damageMult: 1.20,
    condition: "melee",
  },
  twisted_bow: {
    id: "twisted_bow",
    name: "Twisted bow",
    accuracyMult: 1.0,
    damageMult: 1.0,
    condition: "ranged",
  },
  tome_of_fire: {
    id: "tome_of_fire",
    name: "Tome of fire",
    accuracyMult: 1.0,
    damageMult: 1.50,
    condition: "magic",
  },
  inquisitor: {
    id: "inquisitor",
    name: "Inquisitor's armour",
    accuracyMult: 1.025,
    damageMult: 1.025,
    condition: "melee",
  },
  crystal_armour: {
    id: "crystal_armour",
    name: "Crystal armour set",
    accuracyMult: 1.30,
    damageMult: 1.15,
    condition: "ranged",
  },
  obsidian: {
    id: "obsidian",
    name: "Obsidian armour set",
    accuracyMult: 1.10,
    damageMult: 1.10,
    condition: "melee",
  },
  berserker_necklace: {
    id: "berserker_necklace",
    name: "Berserker necklace",
    accuracyMult: 1.0,
    damageMult: 1.20,
    condition: "melee",
  },
  keris_partisan: {
    id: "keris_partisan",
    name: "Keris partisan",
    accuracyMult: 1.0,
    damageMult: 1.33,
    condition: "melee",
  },
  leaf_bladed: {
    id: "leaf_bladed",
    name: "Leaf-bladed battleaxe",
    accuracyMult: 1.175,
    damageMult: 1.175,
    condition: "melee",
  },
};

function twistedBowAccuracy(targetMagicLevel: number): number {
  const magic = Math.min(targetMagicLevel, 250);
  const bonus = 140 + Math.floor((10 * 3 * magic - 10) / 100) - Math.floor((Math.pow(3 * magic - 100, 2)) / 100);
  return Math.min(Math.max(bonus, 0), 140) / 100;
}

function twistedBowDamage(targetMagicLevel: number): number {
  const magic = Math.min(targetMagicLevel, 250);
  const bonus = 250 + Math.floor((10 * 3 * magic - 14) / 100) - Math.floor((Math.pow(3 * magic - 140, 2)) / 100);
  return Math.min(Math.max(bonus, 0), 250) / 100;
}

export function applyModifiers(
  baseAccuracyMult: number,
  baseDamageMult: number,
  combatStyle: "melee" | "ranged" | "magic",
  modifiers: DpsModifier[],
  targetMagicLevel?: number
): { accuracyMult: number; damageMult: number } {
  let accuracyMult = baseAccuracyMult;
  let damageMult = baseDamageMult;

  for (const mod of modifiers) {
    if (mod.condition && mod.condition !== combatStyle) continue;

    if (mod.id === "twisted_bow" && targetMagicLevel != null) {
      accuracyMult *= twistedBowAccuracy(targetMagicLevel);
      damageMult *= twistedBowDamage(targetMagicLevel);
    } else {
      accuracyMult *= mod.accuracyMult;
      damageMult *= mod.damageMult;
    }
  }

  return { accuracyMult, damageMult };
}

export function effectiveLevel(
  level: number,
  prayerMult: number,
  stanceBonus: number
): number {
  return Math.floor(level * prayerMult) + stanceBonus + 8;
}

export function maxHit(effectiveStr: number, strBonus: number): number {
  return Math.floor(0.5 + (effectiveStr * (strBonus + 64)) / 640);
}

export function attackRoll(effectiveAtk: number, atkBonus: number): number {
  return effectiveAtk * (atkBonus + 64);
}

export function defenseRoll(defLevel: number, defBonus: number): number {
  return (defLevel + 9) * (defBonus + 64);
}

export function hitChance(atkRoll: number, defRoll: number): number {
  if (atkRoll > defRoll) {
    return 1 - (defRoll + 2) / (2 * (atkRoll + 1));
  }
  return atkRoll / (2 * (defRoll + 1));
}

export function dps(
  maxHitValue: number,
  accuracy: number,
  attackSpeed: number
): number {
  return (maxHitValue * accuracy) / (2 * attackSpeed * 0.6);
}

export function timeToKill(hp: number, dpsValue: number): number {
  return dpsValue > 0 ? hp / dpsValue : Infinity;
}

// Note: Magic DPS is approximate. OSRS magic damage is primarily spell-base + magic dmg %,
// not level-based like melee/ranged. This uses the standard formula which is accurate for
// powered staves (Trident, Sanguinesti, Tumeken's shadow) where level matters.
// Standard spellbook spells have fixed max hits not modeled here.
export function calculateDps(input: DpsInput) {
  const effAtk = effectiveLevel(
    input.combatStyle === "melee"
      ? input.attackLevel
      : input.combatStyle === "ranged"
        ? input.rangedLevel
        : input.magicLevel,
    input.prayerAttackMult,
    input.stanceAttackBonus
  );
  const effStr = effectiveLevel(
    input.combatStyle === "melee"
      ? input.strengthLevel
      : input.combatStyle === "ranged"
        ? input.rangedLevel
        : input.magicLevel,
    input.prayerStrengthMult,
    input.stanceStrengthBonus
  );

  let mh = maxHit(effStr, input.strengthBonus);
  let ar = attackRoll(effAtk, input.attackBonus);

  if (input.modifiers && input.modifiers.length > 0) {
    const { accuracyMult, damageMult } = applyModifiers(
      1,
      1,
      input.combatStyle,
      input.modifiers,
      input.targetMagicLevel
    );
    ar = Math.floor(ar * accuracyMult);
    mh = Math.floor(mh * damageMult);
  }

  const dr = defenseRoll(input.targetDefLevel, input.targetDefBonus);
  const acc = hitChance(ar, dr);
  const d = dps(mh, acc, input.attackSpeed);
  const ttk = timeToKill(input.targetHp, d);

  return { maxHit: mh, accuracy: acc, dps: d, ttk, attackRoll: ar, defenseRoll: dr };
}
