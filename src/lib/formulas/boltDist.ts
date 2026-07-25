/**
 * Enchanted bolt damage PMFs for wiki-aligned EV and overkill-aware TTK.
 * Proc rates match the public PvM rates used by the wiki DPS calculator.
 */
import { hitDistribution, type HitDistribution } from "./hitDistribution";

/** Enchanted bolt types with non-trivial DPS impact. */
export type BoltEnchant =
  | "none"
  | "diamond"
  | "ruby"
  | "dragonstone"
  | "onyx"
  | "opal"
  | "emerald";

/** Wiki PvM enchant proc chances (approximate public rates). */
export const BOLT_PROC_CHANCE: Record<Exclude<BoltEnchant, "none">, number> = {
  diamond: 0.1,
  ruby: 0.11,
  dragonstone: 0.06,
  onyx: 0.11,
  opal: 0.05,
  emerald: 0.54,
};

/** Infer bolt enchant from ammo item name. */
export function inferBoltEnchant(ammoName?: string): BoltEnchant {
  const n = (ammoName ?? "").toLowerCase();
  if (!n.includes("bolt")) return "none";
  if (n.includes("diamond")) return "diamond";
  if (n.includes("ruby")) return "ruby";
  if (n.includes("dragonstone")) return "dragonstone";
  if (n.includes("onyx")) return "onyx";
  if (n.includes("opal")) return "opal";
  if (n.includes("emerald")) return "emerald";
  return "none";
}

function finalize(pmf: number[]): HitDistribution {
  let expectedHit = 0;
  let cumulative = 0;
  let medianHit = 0;
  let foundMedian = false;
  for (let k = 0; k < pmf.length; k++) {
    expectedHit += k * (pmf[k] ?? 0);
    cumulative += pmf[k] ?? 0;
    if (!foundMedian && cumulative >= 0.5) {
      medianHit = k;
      foundMedian = true;
    }
  }
  if (!foundMedian) medianHit = Math.max(0, pmf.length - 1);
  return { pmf, expectedHit, zeroChance: pmf[0] ?? 1, medianHit };
}

function scalePmf(pmf: number[], weight: number): number[] {
  return pmf.map((p) => p * weight);
}

function addPmfs(a: number[], b: number[]): number[] {
  const n = Math.max(a.length, b.length);
  const out = new Array(n).fill(0);
  for (let i = 0; i < n; i++) out[i] = (a[i] ?? 0) + (b[i] ?? 0);
  return out;
}

function pointMass(damage: number, weight: number): number[] {
  const d = Math.max(0, Math.floor(damage));
  const pmf = new Array(d + 1).fill(0);
  pmf[d] = weight;
  return pmf;
}

/**
 * Full damage PMF for one attack with enchanted bolts.
 * Mixture of no-proc normal hit dist and enchant-specific proc dist.
 */
export function boltEnchantHitDistribution(opts: {
  enchant: BoltEnchant;
  maxHit: number;
  accuracy: number;
  targetHp: number;
  rangedLevel: number;
  guaranteedProc?: boolean;
}): HitDistribution {
  const { enchant, maxHit, accuracy, targetHp, rangedLevel, guaranteedProc } = opts;
  if (enchant === "none") return hitDistribution(maxHit, accuracy);

  const p = guaranteedProc ? 1 : BOLT_PROC_CHANCE[enchant];
  const normal = hitDistribution(maxHit, accuracy);

  let procPmf: number[];
  switch (enchant) {
    case "diamond":
      // Guaranteed hit, uniform 0..max
      procPmf = hitDistribution(maxHit, 1).pmf;
      break;
    case "ruby": {
      const dmg = Math.min(100, Math.floor(targetHp * 0.2));
      procPmf = pointMass(dmg, 1);
      break;
    }
    case "dragonstone": {
      const a = Math.min(1, Math.max(0, accuracy));
      procPmf = pointMass(maxHit, a);
      procPmf[0] = (procPmf[0] ?? 0) + (1 - a);
      break;
    }
    case "onyx":
      procPmf = normal.pmf;
      break;
    case "opal": {
      const extra = Math.floor(rangedLevel / 10);
      procPmf = hitDistribution(maxHit + extra, accuracy).pmf;
      break;
    }
    case "emerald":
      // Damage PMF same as normal; poison EV applied below
      procPmf = normal.pmf;
      break;
    default:
      procPmf = normal.pmf;
  }

  const mixed = addPmfs(scalePmf(normal.pmf, 1 - p), scalePmf(procPmf, p));
  const dist = finalize(mixed);
  if (enchant === "emerald") {
    return { ...dist, expectedHit: dist.expectedHit + p * 2 };
  }
  return dist;
}

export function boltEnchantExpectedFromPmf(opts: {
  enchant: BoltEnchant;
  maxHit: number;
  accuracy: number;
  targetHp: number;
  rangedLevel: number;
  guaranteedProc?: boolean;
}): number {
  return boltEnchantHitDistribution(opts).expectedHit;
}
