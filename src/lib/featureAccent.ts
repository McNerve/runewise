import type { View } from "./features";

/**
 * Feature accent — one accent family (rune/magic gold) with three strengths.
 * Collapsed in v1.6 from ~38 distinct hues to unify visual language.
 *
 * The ONE localized exception is TIER_COLORS (Clue Helper) — don't collapse that.
 */
const STRONG = "#d4a574"; // primary rune gold — headline features
const MID = "#b8895f"; // 70% saturation — calculators, utilities
const SOFT = "#8a6a4a"; // 50% saturation — meta / settings / secondary tools

const FEATURE_ACCENTS: Record<View, string> = {
  // Headline / primary destinations
  home: STRONG,
  overview: STRONG,
  "dps-calc": STRONG,
  bosses: STRONG,
  market: STRONG,
  "money-making": STRONG,

  // Mid-tier tools
  "collection-log": MID,
  lookup: MID,
  tracker: MID,
  "skill-calc": MID,
  "training-plan": MID,
  "gear-compare": MID,
  "dry-calc": MID,
  "pet-calc": MID,
  raids: MID,
  loot: MID,
  "combat-tasks": MID,
  "production-calc": MID,
  "shop-helper": MID,
  kingdom: MID,
  watchlist: MID,
  progress: MID,
  slayer: MID,
  "clue-helper": MID,
  spells: MID,
  "world-map": MID,
  stars: MID,
  news: MID,
  wiki: MID,
  timers: MID,
  "xp-table": MID,

  // Meta / soft
  settings: SOFT,
  about: SOFT,
};

export function getFeatureAccent(view: View): string {
  return FEATURE_ACCENTS[view] ?? SOFT;
}
