export function petChance(actions: number, rate: number): number {
  return 1 - Math.pow(1 - 1 / rate, actions);
}

export function actionsForChance(rate: number, targetChance: number): number {
  return Math.ceil(Math.log(1 - targetChance) / Math.log(1 - 1 / rate));
}
