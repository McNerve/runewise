/** Weakness label from wiki/infobox → DPS Calc combat style. */
const WEAKNESS_STYLE_MAP: Record<string, string> = {
  stab: "melee",
  slash: "melee",
  crush: "melee",
  melee: "melee",
  ranged: "ranged",
  range: "ranged",
  magic: "magic",
  mage: "magic",
};

export function weaknessToStyle(weakness: string): string {
  return WEAKNESS_STYLE_MAP[weakness.toLowerCase()] ?? "melee";
}

/** Attempt to extract weakness from description prose as fallback. */
export function extractWeaknessFromSummary(summary: string | undefined): string | null {
  if (!summary) return null;
  const m = summary.match(/weak(?:\s+against|\s+to|ness:?)\s+([a-z]+)/i);
  return m?.[1] ?? null;
}

export function normalizeBossSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
