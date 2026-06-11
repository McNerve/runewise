/**
 * Parses a wiki rarity string into an effective rate denominator (one drop
 * per N kills). Handles "Always", "1/128", "3/128", and multi-roll forms
 * like "2 × 1/128" / "2 x 1/128". Returns null for unparseable strings.
 */
export function parseRate(rarity: string): number | null {
  // Wiki rarity cells are short; cap length so a vandalized cell can't
  // stall the regex on a huge digit run.
  const lower = rarity.slice(0, 64).toLowerCase();
  if (lower.includes("always")) return 1;
  const match = lower.match(/(?:(\d+)\s*[x×]\s*)?(\d[\d.,]*)\s*\/\s*([\d.,]+)/);
  if (!match) return null;
  const rolls = match[1] ? Number(match[1]) : 1;
  const numerator = Number(match[2].replace(/,/g, ""));
  const denominator = Number(match[3].replace(/,/g, ""));
  if ([rolls, numerator, denominator].some((n) => !Number.isFinite(n) || n <= 0)) {
    return null;
  }
  return denominator / (numerator * rolls);
}
