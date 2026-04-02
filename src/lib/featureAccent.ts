import type { View } from "./features";

const FEATURE_ACCENTS: Record<View, string> = {
  home: "#d6b36a",
  overview: "#60a5fa",
  lookup: "#93c5fd",
  tracker: "#34d399",
  "skill-calc": "#c084fc",
  "dps-calc": "#a78bfa",
  "dry-calc": "#f59e0b",
  "pet-calc": "#f472b6",
  bosses: "#f97316",
  loot: "#facc15",
  "combat-tasks": "#fb7185",
  market: "#22c55e",
  watchlist: "#22c55e",
  progress: "#2dd4bf",
  slayer: "#ef4444",
  "clue-helper": "#a78bfa",
  "money-making": "#fbbf24",
  stars: "#fbbf24",
  news: "#38bdf8",
  wiki: "#2dd4bf",
  timers: "#4ade80",
  "xp-table": "#c084fc",
  settings: "#94a3b8",
  about: "#94a3b8",
};

export function getFeatureAccent(view: View): string {
  return FEATURE_ACCENTS[view] ?? "#94a3b8";
}
