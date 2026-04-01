/** Probability of getting at least 1 drop in N kills at rate 1/rate */
export function dropChance(kills: number, rate: number): number {
  return 1 - Math.pow(1 - 1 / rate, kills);
}

/** Kills needed for a given confidence level (e.g., 0.95 for 95%) */
export function killsForConfidence(rate: number, confidence: number): number {
  return Math.ceil(Math.log(1 - confidence) / Math.log(1 - 1 / rate));
}

/** How dry you are — percentile of players who would have received the drop */
export function dryPercentile(kills: number, rate: number): number {
  return dropChance(kills, rate) * 100;
}
