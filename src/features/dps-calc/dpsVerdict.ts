export type AccuracyTier = "high" | "moderate" | "low";

export interface AccuracyTone {
  text: string;
  bar: string;
  label: string;
}

const ACCURACY_TONE: Record<AccuracyTier, AccuracyTone> = {
  high: { text: "text-success", bar: "bg-success", label: "High accuracy" },
  moderate: { text: "text-warning", bar: "bg-warning", label: "Moderate accuracy" },
  low: { text: "text-danger", bar: "bg-danger", label: "Low accuracy" },
};

export function accuracyTier(accuracy: number): AccuracyTier {
  if (accuracy >= 0.8) return "high";
  if (accuracy >= 0.5) return "moderate";
  return "low";
}

export function accuracyTone(accuracy: number): AccuracyTone {
  return ACCURACY_TONE[accuracyTier(accuracy)];
}

export function formatTtk(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return "—";
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

export function dpsVerdict(opts: {
  monsterName: string | null;
  dps: number;
  ttk: number;
  accuracy: number;
}): string {
  const { monsterName, dps, ttk, accuracy } = opts;
  const accPct = Math.round(accuracy * 100);
  const tier = accuracyTier(accuracy);
  const ttkLabel = formatTtk(ttk);
  const target = monsterName?.trim() || "This target";

  if (dps <= 0 || !isFinite(dps)) {
    return "No damage — check the style, weapon, and target.";
  }

  const lead = `${target} dies in ${ttkLabel} at ${dps.toFixed(2)} DPS (${accPct}% accurate).`;

  if (tier === "low") {
    return `${lead} You're missing more than you hit — lower defence or switch style.`;
  }
  if (tier === "moderate") {
    return `${lead} Accuracy is the bottleneck — DWH specs or a better attack type will help.`;
  }
  return `${lead} High accuracy — upgrades that raise max hit or speed win from here.`;
}
