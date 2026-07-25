// Single-attack and multi-hit damage distributions for OSRS combat.
// Standard attacks: connect with probability `accuracy`, then roll uniform [0, maxHit].
// Fang / scythe / claws use specialized shapes matching the wiki DPS calc.

export interface HitDistribution {
  /** pmf[k] = probability the attack deals exactly k damage (index 0..maxHit). */
  pmf: number[];
  expectedHit: number;
  /** Probability of dealing zero damage (miss, or connecting 0-roll). */
  zeroChance: number;
  /** Smallest damage d such that P(damage <= d) >= 0.5. */
  medianHit: number;
}

function finalizePmf(pmf: number[]): HitDistribution {
  let expectedHit = 0;
  let cumulative = 0;
  let medianHit = 0;
  let foundMedian = false;
  for (let k = 0; k < pmf.length; k++) {
    expectedHit += k * pmf[k];
    cumulative += pmf[k];
    if (!foundMedian && cumulative >= 0.5) {
      medianHit = k;
      foundMedian = true;
    }
  }
  if (!foundMedian) medianHit = Math.max(0, pmf.length - 1);
  return {
    pmf,
    expectedHit,
    zeroChance: pmf[0] ?? 1,
    medianHit,
  };
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

  return finalizePmf(pmf);
}

/**
 * Osmumten's fang hit PMF given **already-computed fang accuracy**
 * (wiki BaseCalc.getFangAccuracyRoll — not independent 1-(1-p)²).
 * Successful hits re-roll into [trunc(15% max), trunc(85% max)].
 */
export function fangHitDistribution(maxHit: number, fangAccuracy: number): HitDistribution {
  const m = Math.max(0, Math.floor(maxHit));
  const a = Math.min(1, Math.max(0, fangAccuracy));

  if (m === 0) {
    return { pmf: [1], expectedHit: 0, zeroChance: 1, medianHit: 0 };
  }

  const lo = Math.trunc(m * 0.15);
  const hi = Math.trunc(m * 0.85);
  const span = hi - lo + 1;
  const pmf = new Array<number>(m + 1).fill(0);
  const miss = 1 - a;
  pmf[0] += miss;

  if (span <= 0) {
    pmf[0] += a;
    return finalizePmf(pmf);
  }

  const per = a / span;
  for (let d = lo; d <= hi; d++) {
    pmf[d] = (pmf[d] ?? 0) + per;
  }
  return finalizePmf(pmf);
}

/**
 * @deprecated Independent double-roll approximation. Prefer fangHitChance(atk, def)
 * from dps.ts (wiki closed form). Kept for call-site compatibility.
 */
export function fangAccuracy(singleRollAccuracy: number): number {
  const a = Math.min(1, Math.max(0, singleRollAccuracy));
  return 1 - (1 - a) ** 2;
}

/** Expected damage for a fang hit given fang accuracy (wiki formula already applied). */
export function fangExpectedHit(maxHit: number, fangAccuracyValue: number): number {
  return fangHitDistribution(maxHit, fangAccuracyValue).expectedHit;
}

/**
 * Scythe of vitur multi-hitsplat: 1/2/3 independent rolls by NPC size.
 * Hit 1: full max; hit 2: floor(max/2); hit 3: floor(max/4). Each uses full accuracy.
 */
export function scytheHitDistribution(
  maxHit: number,
  accuracy: number,
  monsterSize: number
): HitDistribution {
  const hits = Math.max(1, Math.min(3, Math.floor(monsterSize)));
  const m = Math.max(0, Math.floor(maxHit));
  const fractions = [1, 0.5, 0.25];
  let combined: number[] = [1]; // start with 0-damage certainty, convolve each splat

  for (let i = 0; i < hits; i++) {
    const hitMax = Math.floor(m * fractions[i]);
    const part = hitDistribution(hitMax, accuracy).pmf;
    combined = convolvePmfs(combined, part);
  }
  return finalizePmf(combined);
}

/** Discrete convolution of two non-negative PMFs. */
export function convolvePmfs(a: number[], b: number[]): number[] {
  const out = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    if (a[i] === 0) continue;
    for (let j = 0; j < b.length; j++) {
      out[i + j] += a[i] * b[j];
    }
  }
  return out;
}

/**
 * Dragon claws Slice and Dice total-damage PMF (wiki dClawDist simplified to
 * total damage mass). Used for expected damage and overkill-aware TTK of specs.
 */
export function dragonClawsHitDistribution(maxHit: number, accuracy: number): HitDistribution {
  const m = Math.max(0, Math.floor(maxHit));
  const a = Math.min(1, Math.max(0, accuracy));
  if (m === 0) return { pmf: [1], expectedHit: 0, zeroChance: 1, medianHit: 0 };

  // Max theoretical total from the four-splat cascade.
  const maxTotal = (m - 1) + Math.max(0, Math.floor(m / 2) - 1)
    + Math.max(0, Math.floor(m / 4) - 1) + Math.floor(m / 4);
  const pmf = new Array(Math.max(maxTotal, 2) + 1).fill(0);

  const addUniform = (chance: number, lo: number, hi: number, map: (dmg: number) => number) => {
    if (chance <= 0 || hi < lo) return;
    const span = hi - lo + 1;
    const per = chance / span;
    for (let d = lo; d <= hi; d++) {
      const total = map(d);
      const idx = Math.max(0, Math.min(pmf.length - 1, total));
      pmf[idx] += per;
    }
  };

  // First connecting roll k=0..3 with ranges matching wiki generateTotals(…, highOffset -1).
  for (let accRoll = 0; accRoll < 4; accRoll++) {
    const low = Math.trunc((m * (4 - accRoll)) / 4);
    const high = m + low - 1;
    const chance = (1 - a) ** accRoll * a;
    if (accRoll === 0) {
      addUniform(chance, low, high, (dmg) =>
        Math.trunc(dmg / 2) + Math.trunc(dmg / 4) + Math.trunc(dmg / 8) + Math.trunc(dmg / 8) + 1
      );
    } else if (accRoll === 1) {
      addUniform(chance, low, high, (dmg) =>
        Math.trunc(dmg / 2) + Math.trunc(dmg / 4) + Math.trunc(dmg / 4) + 1
      );
    } else if (accRoll === 2) {
      addUniform(chance, low, high, (dmg) =>
        Math.trunc(dmg / 2) + Math.trunc(dmg / 2) + 1
      );
    } else {
      addUniform(chance, low, high, (dmg) => dmg + 1);
    }
  }

  const allFail = (1 - a) ** 4;
  // 2/3 chance deal 2 (1+1), 1/3 deal 0 — wiki dClawDist
  pmf[2] = (pmf[2] ?? 0) + allFail * (2 / 3);
  pmf[0] = (pmf[0] ?? 0) + allFail * (1 / 3);

  return finalizePmf(pmf);
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
 * Kill-time statistics from an arbitrary per-attack damage PMF (overkill-aware).
 */
export function killTimeStatsFromPmf(
  pmf: number[],
  hp: number,
  attackSpeedTicks: number
): KillTimeStats | null {
  const targetHp = Math.max(1, Math.floor(hp));
  if (pmf.length === 0) return null;
  const zero = pmf[0] ?? 1;
  if (zero >= 1 - 1e-15) return null;

  const m = pmf.length - 1;
  const tickSeconds = attackSpeedTicks * 0.6;

  const expected = new Array<number>(targetHp + 1).fill(0);
  for (let h = 1; h <= targetHp; h++) {
    let acc = 1;
    for (let k = 1; k <= m; k++) {
      const p = pmf[k] ?? 0;
      if (p === 0) continue;
      const rest = h - k;
      if (rest > 0) acc += p * expected[rest];
    }
    expected[h] = acc / (1 - zero);
  }
  const expectedAttacks = expected[targetHp];

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
          const p = pmf[k] ?? 0;
          if (p === 0) continue;
          const rest = h - k;
          if (rest > 0) next[rest] += mass * p;
          else dead += mass * p;
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
  const { pmf } = hitDistribution(m, accuracy);
  if (m === 0 || pmf[0] >= 1) return null;
  return killTimeStatsFromPmf(pmf, hp, attackSpeedTicks);
}

/** Overkill-aware TTK for fang attacks. */
export function fangKillTimeStats(
  maxHit: number,
  accuracy: number,
  hp: number,
  attackSpeedTicks: number
): KillTimeStats | null {
  const dist = fangHitDistribution(maxHit, accuracy);
  if (dist.zeroChance >= 1) return null;
  return killTimeStatsFromPmf(dist.pmf, hp, attackSpeedTicks);
}

/** Overkill-aware TTK for scythe multi-hitsplat attacks. */
export function scytheKillTimeStats(
  maxHit: number,
  accuracy: number,
  monsterSize: number,
  hp: number,
  attackSpeedTicks: number
): KillTimeStats | null {
  const dist = scytheHitDistribution(maxHit, accuracy, monsterSize);
  if (dist.zeroChance >= 1) return null;
  return killTimeStatsFromPmf(dist.pmf, hp, attackSpeedTicks);
}

export type AttackShape = "standard" | "fang" | "scythe";

/** Pick the right per-attack distribution for UI charts and TTK. */
export function attackHitDistribution(
  shape: AttackShape,
  maxHit: number,
  accuracy: number,
  monsterSize = 1
): HitDistribution {
  if (shape === "fang") return fangHitDistribution(maxHit, accuracy);
  if (shape === "scythe") return scytheHitDistribution(maxHit, accuracy, monsterSize);
  return hitDistribution(maxHit, accuracy);
}

export function attackKillTimeStats(
  shape: AttackShape,
  maxHit: number,
  accuracy: number,
  hp: number,
  attackSpeedTicks: number,
  monsterSize = 1
): KillTimeStats | null {
  if (shape === "fang") return fangKillTimeStats(maxHit, accuracy, hp, attackSpeedTicks);
  if (shape === "scythe") {
    return scytheKillTimeStats(maxHit, accuracy, monsterSize, hp, attackSpeedTicks);
  }
  return killTimeStats(maxHit, accuracy, hp, attackSpeedTicks);
}
