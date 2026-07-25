import type { SearchResult } from "./search";

/**
 * Score a result against the query. Higher is better.
 * Features (kind View) and exact title/alias hits rank above "Lookup player".
 */
export function scoreSearchResult(result: SearchResult, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  const name = result.name.toLowerCase();
  const hay = `${result.name} ${result.category} ${result.kind ?? ""} ${result.searchText ?? ""}`.toLowerCase();

  let score = 0;

  // Kind weights — Views (features) dominate shortcuts
  if (result.kind === "View") score += 300;
  else if (result.kind === "Sub-tab" || result.kind === "Workspace") score += 160;
  else if (result.kind === "Calculator") score += 140;
  else if (result.category === "Boss") score += 100;
  else if (result.kind === "Player") score += 5;
  else if (result.kind === "Wiki") score += 8;
  else if (result.kind === "Item" && result.category === "Shortcut") score += 10;
  else if (result.category === "Shortcut") score += 15;
  else score += 50;

  // Match quality on title
  if (name === q) score += 500;
  else if (name.startsWith(q)) score += 220;
  else if (name.includes(q)) score += 120;

  // Alias / searchText token hits (e.g. "loadout" in loadout-finder aliases)
  const tokens = (result.searchText ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.includes(q)) score += 200;
  if (tokens.some((t) => t.startsWith(q) && q.length >= 3)) score += 80;
  if (hay.includes(q)) score += 20;

  const parts = q.split(/\s+/).filter(Boolean);
  if (parts.length > 1 && parts.every((p) => hay.includes(p))) score += 90;

  return score;
}

/**
 * Rank results so real features beat "Lookup player X" shortcuts on Enter.
 */
export function rankSearchResults(
  results: SearchResult[],
  query: string,
  freq: Record<string, number> = {}
): SearchResult[] {
  const q = query.trim();
  return [...results]
    .map((r) => {
      const base = scoreSearchResult(r, q);
      const key = `${r.view}:${r.name}`;
      const boost = Math.min(40, (freq[key] ?? 0) * 4);
      return { r, score: base + boost };
    })
    .sort((a, b) => b.score - a.score || a.r.name.localeCompare(b.r.name))
    .map((x) => x.r);
}
