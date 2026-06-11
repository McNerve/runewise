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

export interface KillTimeStats {
  /** Exact expected number of attacks to kill, overkill-aware. */
  expectedAttacks: number;
  expectedSeconds: number;
  /** Smallest n with P(dead within n attacks) >= 0.5 / 0.9. Null when the
   * computation budget was exceeded (huge HP pools). */
  medianAttacks: number | null;
  p90Attacks: number | null;
  medianSeconds: number | null;
  p90Seconds: number | null;
}

// Percentile iteration is O(hp x maxHit) per attack; skip it past this budget
// so raid-scaled HP pools can't stall the UI. Expected attacks stay exact.
const PERCENTILE_OPS_BUDGET = 40_000_000;
const MAX_PERCENTILE_ATTACKS = 3000;

/**
 * Kill-time statistics from the true damage distribution. Unlike hp / dps,
 * this charges full attacks for partial overkill damage and models hit
 * variance, so it is exact for expected attacks and gives real percentiles.
 */
export function killTimeStats(
  maxHit: number,
  accuracy: number,
  hp: number,
  attackSpeedTicks: number
): KillTimeStats | null {
  const m = Math.max(0, Math.floor(maxHit));
  const targetHp = Math.max(1, Math.floor(hp));
  const { pmf } = hitDistribution(m, accuracy);
  if (m === 0 || pmf[0] >= 1) return null;

  const tickSeconds = attackSpeedTicks * 0.6;

  // Expected attacks: E[h] = (1 + sum_{k>=1} pmf[k] * E[max(0, h - k)]) / (1 - pmf[0])
  const expected = new Array<number>(targetHp + 1).fill(0);
  for (let h = 1; h <= targetHp; h++) {
    let acc = 1;
    for (let k = 1; k <= m; k++) {
      const rest = h - k;
      if (rest > 0) acc += pmf[k] * expected[rest];
    }
    expected[h] = acc / (1 - pmf[0]);
  }
  const expectedAttacks = expected[targetHp];

  // Percentiles: walk the distribution over remaining HP attack by attack.
  let medianAttacks: number | null = null;
  let p90Attacks: number | null = null;
  if (targetHp * m * Math.min(expectedAttacks * 4, MAX_PERCENTILE_ATTACKS) <= PERCENTILE_OPS_BUDGET) {
    let alive = new Array<number>(targetHp + 1).fill(0);
    alive[targetHp] = 1;
    let dead = 0;
    for (let n = 1; n <= MAX_PERCENTILE_ATTACKS && p90Attacks === null; n++) {
      const next = new Array<number>(targetHp + 1).fill(0);
      for (let h = 1; h <= targetHp; h++) {
        const mass = alive[h];
        if (mass === 0) continue;
        for (let k = 0; k <= m; k++) {
          const rest = h - k;
          if (rest > 0) next[rest] += mass * pmf[k];
          else dead += mass * pmf[k];
        }
      }
      alive = next;
      if (medianAttacks === null && dead >= 0.5) medianAttacks = n;
      if (p90Attacks === null && dead >= 0.9) p90Attacks = n;
    }
  }

  return {
    expectedAttacks,
    expectedSeconds: expectedAttacks * tickSeconds,
    medianAttacks,
    p90Attacks,
    medianSeconds: medianAttacks !== null ? medianAttacks * tickSeconds : null,
    p90Seconds: p90Attacks !== null ? p90Attacks * tickSeconds : null,
  };
}
