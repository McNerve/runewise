export interface CombatStats {
  attack: number;
  strength: number;
  defence: number;
  hitpoints: number;
  prayer: number;
  ranged: number;
  magic: number;
}

/** Calculate OSRS combat level */
export function combatLevel(stats: CombatStats): number {
  const base =
    0.25 * (stats.defence + stats.hitpoints + Math.floor(stats.prayer / 2));
  const melee = 0.325 * (stats.attack + stats.strength);
  const ranged = 0.325 * (Math.floor(stats.ranged / 2) + stats.ranged);
  const magic = 0.325 * (Math.floor(stats.magic / 2) + stats.magic);
  return base + Math.max(melee, ranged, magic);
}

/** Melee max hit (simplified — no equipment bonuses yet) */
export function meleeMaxHit(
  strengthLevel: number,
  strengthBonus: number,
  prayerMultiplier: number = 1,
  otherMultiplier: number = 1
): number {
  const effectiveStrength = Math.floor(
    (Math.floor(strengthLevel * prayerMultiplier) + 3) * otherMultiplier
  );
  return Math.floor(
    0.5 + effectiveStrength * (strengthBonus + 64) / 640
  );
}

/** Ranged max hit (simplified) */
export function rangedMaxHit(
  rangedLevel: number,
  rangedStrengthBonus: number,
  prayerMultiplier: number = 1
): number {
  const effectiveRanged = Math.floor(
    Math.floor(rangedLevel * prayerMultiplier) + 3
  );
  return Math.floor(
    0.5 + effectiveRanged * (rangedStrengthBonus + 64) / 640
  );
}
