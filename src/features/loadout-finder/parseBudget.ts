/** Parse free-text budgets: 50m, 1.5b, 250k, 1000000. */
export function parseBudgetInput(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/,/g, "").replace(/\s/g, "");
  if (!s) return null;
  const m = s.match(/^(\d+(?:\.\d+)?)([kmb])?$/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n < 0) return null;
  const mult =
    m[2] === "k" ? 1_000 : m[2] === "m" ? 1_000_000 : m[2] === "b" ? 1_000_000_000 : 1;
  return Math.floor(n * mult);
}
