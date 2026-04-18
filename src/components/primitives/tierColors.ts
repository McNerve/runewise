// Canonical OSRS tier palette — source of truth for any tier-aware UI
// (Clue Helper, Combat Tasks, Raids tier hints, etc.).
// Kept in a separate module from <TierBadge /> so non-badge contexts can
// import the palette without bundling React and to satisfy react-refresh
// "only components per file" lint.

export type Tier =
  | "Beginner"
  | "Easy"
  | "Medium"
  | "Hard"
  | "Elite"
  | "Master"
  | "Grandmaster";

export interface TierClassSet {
  text: string;
  border: string;
  bg: string;
  badge: string;
  activeBorder: string;
  activeBg: string;
}

export const TIER_COLORS: Record<Tier, TierClassSet> = {
  Beginner: {
    text: "text-text-secondary",
    border: "border-text-secondary/30",
    bg: "bg-text-secondary/5",
    badge: "bg-text-secondary/15 text-text-secondary",
    activeBorder: "border-text-secondary/50",
    activeBg: "bg-text-secondary/10",
  },
  Easy: {
    text: "text-success",
    border: "border-success/30",
    bg: "bg-success/5",
    badge: "bg-success/15 text-success",
    activeBorder: "border-success/50",
    activeBg: "bg-success/10",
  },
  Medium: {
    text: "text-accent",
    border: "border-accent/30",
    bg: "bg-accent/5",
    badge: "bg-accent/15 text-accent",
    activeBorder: "border-accent/50",
    activeBg: "bg-accent/10",
  },
  Hard: {
    text: "text-warning",
    border: "border-warning/30",
    bg: "bg-warning/5",
    badge: "bg-warning/15 text-warning",
    activeBorder: "border-warning/50",
    activeBg: "bg-warning/10",
  },
  Elite: {
    text: "text-purple-400",
    border: "border-purple-400/30",
    bg: "bg-purple-500/5",
    badge: "bg-purple-500/15 text-purple-400",
    activeBorder: "border-purple-400/50",
    activeBg: "bg-purple-500/10",
  },
  Master: {
    text: "text-danger",
    border: "border-danger/30",
    bg: "bg-danger/5",
    badge: "bg-danger/15 text-danger",
    activeBorder: "border-danger/50",
    activeBg: "bg-danger/10",
  },
  Grandmaster: {
    text: "text-orange-400",
    border: "border-orange-400/30",
    bg: "bg-orange-500/5",
    badge: "bg-orange-500/15 text-orange-400",
    activeBorder: "border-orange-400/50",
    activeBg: "bg-orange-500/10",
  },
};
