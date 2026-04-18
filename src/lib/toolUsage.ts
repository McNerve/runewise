import type { View } from "./features";
import { loadJSON, saveJSON } from "./localStorage";

const USAGE_KEY = "runewise_tool_usage";
const PINNED_KEY = "runewise_pinned_tools";
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_HITS = 200;

export interface ToolHit {
  view: View;
  at: number;
}

export function loadToolHits(): ToolHit[] {
  const hits = loadJSON<ToolHit[]>(USAGE_KEY, []);
  const cutoff = Date.now() - WINDOW_MS;
  return hits.filter((h) => h.at >= cutoff);
}

export function recordToolHit(view: View): void {
  const hits = loadToolHits();
  hits.push({ view, at: Date.now() });
  // Keep the most recent MAX_HITS entries only.
  const trimmed = hits.slice(-MAX_HITS);
  saveJSON(USAGE_KEY, trimmed);
}

export function getToolFrequency(): Map<View, number> {
  const hits = loadToolHits();
  const counts = new Map<View, number>();
  for (const hit of hits) {
    counts.set(hit.view, (counts.get(hit.view) ?? 0) + 1);
  }
  return counts;
}

export function loadPinnedTools(): View[] {
  return loadJSON<View[]>(PINNED_KEY, []);
}

export function savePinnedTools(pins: View[]): void {
  saveJSON(PINNED_KEY, pins);
}

export function togglePinnedTool(view: View): View[] {
  const current = loadPinnedTools();
  const next = current.includes(view)
    ? current.filter((v) => v !== view)
    : [...current, view];
  savePinnedTools(next);
  return next;
}
