// Single-attack damage distribution for standard OSRS combat: an attack
// connects with probability `accuracy`, and a connecting hit rolls uniformly
// in [0, maxHit]. A connecting roll of 0 is indistinguishable from a miss,
// so both contribute to the zero bucket.

export interface HitDistribution {
  /** pmf[k] = probability the attack deals exactly k damage (index 0..maxHit). */
  pmf: number[];
  expectedHit: number;
  /** Probability of dealing zero damage (miss, or connecting 0-roll). */
  zeroChance: number;
  /** Smallest damage d such that P(damage <= d) >= 0.5. */
  medianHit: number;
}

export function hitDistribution(maxHit: number, accuracy: number): HitDistribution {
  const m = Math.max(0, Math.floor(maxHit));
  const a = Math.min(1, Math.max(0, accuracy));

  if (m === 0) {
    return { pmf: [1], expectedHit: 0, zeroChance: 1, medianHit: 0 };
  }

  const perRoll = a / (m + 1);
  const pmf = new Array<number>(m + 1).fill(perRoll);
  pmf[0] = 1 - a + perRoll;

  let cumulative = 0;
  let medianHit = m;
  for (let k = 0; k <= m; k++) {
    cumulative += pmf[k];
    if (cumulative >= 0.5) {
      medianHit = k;
      break;
    }
  }

  return {
    pmf,
    expectedHit: (a * m) / 2,
    zeroChance: pmf[0],
    medianHit,
  };
}
