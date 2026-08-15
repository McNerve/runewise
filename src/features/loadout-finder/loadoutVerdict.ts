import { dpsVerdict } from "../dps-calc/dpsVerdict";
import { formatGp } from "../../lib/format";
import type { CombatStyle } from "../dps-calc/dpsTypes";

export interface LoadoutPick {
  name: string;
  style: CombatStyle;
  dps: number;
  ttk: number;
  accuracy: number;
  cost: number;
}

export interface LoadoutAlt {
  name: string;
  style: CombatStyle;
  dps: number;
}

function styleLabel(style: CombatStyle): string {
  if (style === "melee") return "Melee";
  if (style === "ranged") return "Ranged";
  return "Magic";
}

function costPhrase(cost: number): string {
  if (cost > 0) return ` for ${formatGp(cost)}`;
  return "";
}

/** Best other-style runner-ups, e.g. "Ranged is 12% behind; Magic is 41% behind." */
export function styleGapLine(pick: LoadoutPick, others: LoadoutAlt[]): string | null {
  if (pick.dps <= 0) return null;
  const bestByStyle = new Map<CombatStyle, LoadoutAlt>();
  for (const row of others) {
    if (row.style === pick.style || row.dps <= 0) continue;
    const prev = bestByStyle.get(row.style);
    if (!prev || row.dps > prev.dps) bestByStyle.set(row.style, row);
  }
  if (bestByStyle.size === 0) {
    const same = others.find((row) => row.style === pick.style && row.dps > 0);
    if (!same) return null;
    const pct = Math.round((1 - same.dps / pick.dps) * 100);
    if (pct <= 0) return `${same.name} is essentially tied.`;
    return `Next ${pick.style} setup is ${pct}% behind.`;
  }
  const parts = [...bestByStyle.values()].map((row) => {
    const pct = Math.round((1 - row.dps / pick.dps) * 100);
    if (pct <= 2) return `${styleLabel(row.style)} is a toss-up`;
    return `${styleLabel(row.style)} is ${pct}% behind`;
  });
  return `${parts.join("; ")}.`;
}

export function loadoutVerdict(opts: {
  pick: LoadoutPick;
  others?: LoadoutAlt[];
  targetName: string | null;
}): string {
  const { pick, others = [], targetName } = opts;
  const wear = `Wear ${pick.name}${costPhrase(pick.cost)}.`;
  if (pick.dps <= 0 || !isFinite(pick.dps)) {
    return `${wear} No damage — check the style, weapon, and target.`;
  }
  const kill = dpsVerdict({
    monsterName: targetName,
    dps: pick.dps,
    ttk: pick.ttk,
    accuracy: pick.accuracy,
  });
  const gap = styleGapLine(pick, others);
  return gap ? `${wear} ${kill} ${gap}` : `${wear} ${kill}`;
}
