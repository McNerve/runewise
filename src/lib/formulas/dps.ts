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
  defReductions?: number; // number of successful DWH/BGS specs (each reduces def by 30%)
  spellBaseMaxHit?: number; // when set, overrides level-based max hit with spell-based formula
  tbowRaidCap?: boolean; // CoX and ToA raise the twisted bow's target-magic clamp from 250 to 350
}

export interface DpsModifier {
  id: string;
  name: string;
  accuracyMult: number;
  damageMult: number;
  condition?: string;
  // Per-combat-style multiplier overrides, e.g. the salve amulet boosts melee
  // and ranged more than magic. Falls back to accuracyMult/damageMult.
  styleOverrides?: Partial<Record<"melee" | "ranged" | "magic", { accuracyMult: number; damageMult: number }>>;
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
    // On task: melee gets 7/6 (16.67%), ranged and magic get a flat 15%.
    accuracyMult: 7 / 6,
    damageMult: 7 / 6,
    styleOverrides: {
      ranged: { accuracyMult: 1.15, damageMult: 1.15 },
      magic: { accuracyMult: 1.15, damageMult: 1.15 },
    },
  },
  salve_e: {
    id: "salve_e",
    name: "Salve amulet (e)",
    accuracyMult: 1.20,
    damageMult: 1.20,
    // Only works for melee and ranged — no effect on magic.
    styleOverrides: { magic: { accuracyMult: 1.0, damageMult: 1.0 } },
  },
  salve_ei: {
    id: "salve_ei",
    name: "Salve amulet (ei)",
    // Flat +20% in every style, magic included — the 15% figure belongs to
    // salve (i), not the enchanted-imbued variant.
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
    // The passive vs turoths/kurasks is damage-only; no accuracy bonus.
    accuracyMult: 1.0,
    damageMult: 1.175,
    condition: "melee",
  },
  tumekens_shadow: {
    id: "tumekens_shadow",
    name: "Tumeken's shadow",
    // Shadow triples the GEAR magic attack bonus and magic damage %, not the
    // base attack-roll constant or the spell's base hit. That gear-only
    // tripling is handled in calculateDps; the generic mult stays a no-op.
    accuracyMult: 1.0,
    damageMult: 1.0,
    condition: "magic",
  },
  virtus: {
    id: "virtus",
    name: "Virtus robes",
    accuracyMult: 1.0,
    damageMult: 1.05,
    condition: "magic",
  },
  dinhs_bulwark: {
    id: "dinhs_bulwark",
    name: "Dinh's bulwark",
    accuracyMult: 1.0,
    damageMult: 1.20,
    condition: "melee",
  },
};

// Modifiers that can't coexist in-game: slayer helm and salve never stack
// (salve takes priority), and only one void set can be worn at a time.
export const EXCLUSIVE_MODIFIER_GROUPS: (keyof typeof DPS_MODIFIERS)[][] = [
  ["slayer_helm", "salve_e", "salve_ei"],
  ["void_melee", "void_ranged", "void_magic", "elite_void_ranged", "elite_void_magic"],
];

/** Adds a modifier id to the set, evicting members of its exclusivity group. */
export function addModifierExclusive(set: Set<string>, id: string): void {
  EXCLUSIVE_MODIFIER_GROUPS.find((group) => group.includes(id))?.forEach((member) => {
    set.delete(member);
  });
  set.add(id);
}

/** Builds a modifier set that respects exclusivity — for restoring saved/imported loadouts. */
export function sanitizeModifierSet(ids: Iterable<string>): Set<string> {
  const set = new Set<string>();
  for (const id of ids) addModifierExclusive(set, id);
  return set;
}

// OSRS Twisted bow scaling: t = 3 * magic / 10 is the key transform. The bonus
// rises with the target's magic level and caps at +140% accuracy / +250% damage.
// The magic level itself is clamped at 250 — 350 inside CoX.
function twistedBowAccuracy(targetMagicLevel: number, magicCap: number): number {
  const magic = Math.min(targetMagicLevel, magicCap);
  const t = (3 * magic) / 10;
  const bonus = 140 + Math.floor((10 * t - 10) / 100) - Math.floor(Math.pow(t - 100, 2) / 100);
  return Math.min(Math.max(bonus, 0), 140) / 100;
}

function twistedBowDamage(targetMagicLevel: number, magicCap: number): number {
  const magic = Math.min(targetMagicLevel, magicCap);
  const t = (3 * magic) / 10;
  const bonus = 250 + Math.floor((10 * t - 14) / 100) - Math.floor(Math.pow(t - 140, 2) / 100);
  return Math.min(Math.max(bonus, 0), 250) / 100;
}

export function applyModifiers(
  baseAccuracyMult: number,
  baseDamageMult: number,
  combatStyle: "melee" | "ranged" | "magic",
  modifiers: DpsModifier[],
  targetMagicLevel?: number,
  tbowMagicCap = 250
): { accuracyMult: number; damageMult: number } {
  let accuracyMult = baseAccuracyMult;
  let damageMult = baseDamageMult;

  for (const mod of modifiers) {
    if (mod.condition && mod.condition !== combatStyle) continue;

    if (mod.id === "twisted_bow" && targetMagicLevel != null) {
      accuracyMult *= twistedBowAccuracy(targetMagicLevel, tbowMagicCap);
      damageMult *= twistedBowDamage(targetMagicLevel, tbowMagicCap);
    } else {
      const override = mod.styleOverrides?.[combatStyle];
      accuracyMult *= override ? override.accuracyMult : mod.accuracyMult;
      damageMult *= override ? override.damageMult : mod.damageMult;
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

  // Tumeken's shadow triples the gear magic attack bonus and magic damage %
  // (the +64 base and spell base hit are untouched).
  const shadowMult = input.combatStyle === "magic"
    && input.modifiers?.some((m) => m.id === "tumekens_shadow") ? 3 : 1;
  const gearAttackBonus = input.attackBonus * shadowMult;
  const gearStrengthBonus = input.strengthBonus * shadowMult;

  // When a spell is selected, use spell base max hit + magic damage %
  // instead of level-based formula. strengthBonus holds magic damage % for magic style.
  let mh = input.spellBaseMaxHit != null
    ? Math.floor(input.spellBaseMaxHit * (1 + gearStrengthBonus / 100))
    : maxHit(effStr, gearStrengthBonus);
  let ar = attackRoll(effAtk, gearAttackBonus);

  if (input.modifiers && input.modifiers.length > 0) {
    const { accuracyMult, damageMult } = applyModifiers(
      1,
      1,
      input.combatStyle,
      input.modifiers,
      input.targetMagicLevel,
      input.tbowRaidCap ? 350 : 250
    );
    ar = Math.floor(ar * accuracyMult);
    mh = Math.floor(mh * damageMult);
  }

  // DWH/BGS specs reduce the target's Defence level — apply before any blend.
  let reducedDefLevel = input.targetDefLevel;
  if (input.defReductions && input.defReductions > 0) {
    for (let i = 0; i < input.defReductions; i++) {
      reducedDefLevel = Math.floor(reducedDefLevel * 0.7); // DWH: 30% reduction each
    }
  }
  // Magic accuracy rolls against a blended defence level: 70% of the target's
  // Magic level + 30% of its (reduced) Defence level, not the raw Defence level.
  const effectiveDefLevel = input.combatStyle === "magic" && input.targetMagicLevel != null
    ? Math.floor(input.targetMagicLevel * 0.7 + reducedDefLevel * 0.3)
    : reducedDefLevel;
  const dr = defenseRoll(effectiveDefLevel, input.targetDefBonus);
  const acc = hitChance(ar, dr);
  const d = dps(mh, acc, input.attackSpeed);
  const ttk = timeToKill(input.targetHp, d);

  return { maxHit: mh, accuracy: acc, dps: d, ttk, attackRoll: ar, defenseRoll: dr };
}

export interface SpecDpsInput extends DpsInput {
  specAccuracyMult: number;
  specDamageMult: number;
  specHits: number;
  specGuaranteedHit: boolean;
  specSpeed: number;
  specCascadeType?: "dragon_claws";
}

// Dragon claws' Slice and Dice rolls accuracy four times. The first successful
// roll deals damage in [maxHit/2, maxHit-1]; any later rolls that connect take
// progressively smaller ranges ([maxHit/4..maxHit/2-1], [maxHit/8..maxHit/4-1],
// [maxHit/8+1..maxHit/4]). If all four miss, the spec deals 1 damage.
export function dragonClawsExpectedDamage(maxHit: number, accuracy: number): number {
  const m = maxHit;
  const ranges: [number, number][] = [
    [Math.floor(m / 2), m - 1],
    [Math.floor(m / 4), Math.floor(m / 2) - 1],
    [Math.floor(m / 8), Math.floor(m / 4) - 1],
    [Math.floor(m / 8) + 1, Math.floor(m / 4)],
  ];
  const expected = ([lo, hi]: [number, number]) => Math.max(0, (lo + hi) / 2);

  let total = 0;
  for (let k = 0; k < 4; k++) {
    // Probability the first connecting roll is attack k (rolls 0..k-1 missed).
    const pFirst = Math.pow(1 - accuracy, k) * accuracy;
    // Once a roll connects, the remaining hits are guaranteed: sum ranges[k..3].
    let conditional = 0;
    for (let i = k; i < 4; i++) {
      conditional += expected(ranges[i]);
    }
    total += pFirst * conditional;
  }
  total += Math.pow(1 - accuracy, 4) * 1;
  return total;
}

export function calculateSpecDps(input: SpecDpsInput) {
  const base = calculateDps(input);
  const specMaxHit = Math.floor(base.maxHit * input.specDamageMult);
  const specAttackRoll = Math.floor(base.attackRoll * input.specAccuracyMult);
  const specAccuracy = input.specGuaranteedHit
    ? 1.0
    : hitChance(specAttackRoll, base.defenseRoll);

  let specTotalDamage: number;
  let specTotalMaxHit: number;
  if (input.specCascadeType === "dragon_claws") {
    specTotalDamage = dragonClawsExpectedDamage(specMaxHit, specAccuracy);
    // Theoretical max: first roll top + next three landing top slots.
    specTotalMaxHit = (specMaxHit - 1)
      + Math.max(0, Math.floor(specMaxHit / 2) - 1)
      + Math.max(0, Math.floor(specMaxHit / 4) - 1)
      + Math.floor(specMaxHit / 4);
  } else {
    specTotalDamage = specAccuracy * (specMaxHit / 2) * input.specHits;
    specTotalMaxHit = specMaxHit * input.specHits;
  }
  const specTotalDps = specTotalDamage / (input.specSpeed * 0.6);

  return {
    ...base,
    specMaxHit: specTotalMaxHit,
    specAccuracy,
    specDps: specTotalDps,
    specTtk: input.targetHp > 0 && specTotalDps > 0 ? input.targetHp / specTotalDps : Infinity,
    specAttackRoll,
  };
}

export function poisonDps(type: "none" | "poison" | "venom"): number {
  if (type === "poison") return 4 / (30 * 0.6); // avg 4 dmg per 30 ticks
  if (type === "venom") return 12 / (30 * 0.6); // avg 12 dmg per 30 ticks (scales up)
  return 0;
}

export interface DpsComparison {
  setup1: ReturnType<typeof calculateDps>;
  setup2: ReturnType<typeof calculateDps>;
  dpsGain: number;
  dpsGainPct: number;
  ttkDiff: number;
}

export function compareDps(input1: DpsInput, input2: DpsInput): DpsComparison {
  const setup1 = calculateDps(input1);
  const setup2 = calculateDps(input2);
  return {
    setup1,
    setup2,
    dpsGain: setup2.dps - setup1.dps,
    dpsGainPct: setup1.dps > 0 ? ((setup2.dps - setup1.dps) / setup1.dps) * 100 : 0,
    ttkDiff: setup1.ttk - setup2.ttk,
  };
}

export function toaDefenseScale(baseDefLevel: number, invocationLevel: number): number {
  const scale = 1 + (invocationLevel / 100);
  return Math.floor(baseDefLevel * scale);
}

export function toaHpScale(baseHp: number, invocationLevel: number): number {
  const scale = 1 + (invocationLevel / 100);
  return Math.floor(baseHp * scale);
}

export function coxHpScale(baseHp: number, partySize: number): number {
  // CoX scales boss HP linearly: base × (1 + 0.5 × (party - 1)) for most bosses
  // Solo = 1×, duo = 1.5×, trio = 2×, etc.
  return Math.floor(baseHp * (1 + 0.5 * (partySize - 1)));
}

export function coxScale(baseDefLevel: number, partySize: number, challengeMode: boolean): number {
  // CoX scales with party size, CM adds ~50%
  const sizeScale = 1 + ((partySize - 1) * 0.5);
  return Math.floor(baseDefLevel * sizeScale * (challengeMode ? 1.5 : 1));
}
