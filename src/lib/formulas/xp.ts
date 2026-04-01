/** Pre-computed XP table for levels 1-126 (99 normal + virtual) */
const XP_LOOKUP: number[] = (() => {
  const table = [0]; // level 1 = 0 XP
  for (let level = 2; level <= 126; level++) {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += Math.floor(i + 300 * Math.pow(2, i / 7));
    }
    table.push(Math.floor(total / 4));
  }
  return table;
})();

/** XP required for a given level (1-126). O(1) lookup. */
export function xpForLevel(level: number): number {
  if (level < 1) return 0;
  if (level > 126) return XP_LOOKUP[125];
  return XP_LOOKUP[level - 1];
}

/** Level for a given XP amount. Binary search, O(log n). */
export function levelForXp(xp: number): number {
  let low = 0;
  let high = XP_LOOKUP.length - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (XP_LOOKUP[mid] <= xp) low = mid;
    else high = mid - 1;
  }
  return low + 1;
}

/** XP table for display (levels 1-99 with diffs) */
export const XP_TABLE: { level: number; xp: number; diff: number }[] =
  XP_LOOKUP.slice(0, 99).map((xp, i) => ({
    level: i + 1,
    xp,
    diff: i > 0 ? xp - XP_LOOKUP[i - 1] : 0,
  }));

export const MAX_XP = 200_000_000;
export const MAX_LEVEL = 99;
