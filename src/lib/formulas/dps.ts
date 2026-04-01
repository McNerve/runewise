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
  const mh = maxHit(effStr, input.strengthBonus);
  const ar = attackRoll(effAtk, input.attackBonus);
  const dr = defenseRoll(input.targetDefLevel, input.targetDefBonus);
  const acc = hitChance(ar, dr);
  const d = dps(mh, acc, input.attackSpeed);
  const ttk = timeToKill(input.targetHp, d);

  return { maxHit: mh, accuracy: acc, dps: d, ttk };
}
