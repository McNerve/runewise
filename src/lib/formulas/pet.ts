export function petChance(actions: number, rate: number): number {
  return 1 - Math.pow(1 - 1 / rate, actions);
}

export function actionsForChance(rate: number, targetChance: number): number {
  return Math.ceil(Math.log(1 - targetChance) / Math.log(1 - 1 / rate));
}

export function skillingPetRate(base: number, level: number, has200m: boolean): number {
  const clamped = Math.max(1, Math.min(99, Math.floor(level)));
  const denom = base - 25 * clamped;
  return has200m ? denom / 15 : denom;
}
