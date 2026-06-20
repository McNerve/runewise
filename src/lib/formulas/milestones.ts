import { xpForLevel } from "./xp";
import type { HiscoreData, HiscoreSkill } from "../api/hiscores";

// Satisfying skill goals to surface as "what's next" — every level up to 50,
// then the round/notable ones. 200M XP is the only goal left at 99.
const LEVEL_MILESTONES = [
  10, 20, 30, 40, 50, 60, 70, 75, 80, 85, 90, 92, 95, 99,
];
export const MAX_SKILL_XP = 200_000_000;

export interface Milestone {
  skill: HiscoreSkill;
  /** Goal label, e.g. "Level 70" or "200M XP". */
  label: string;
  /** Target level (200 sentinel for the 200M-XP goal). */
  target: number;
  /** XP remaining to reach the goal. */
  xpToGo: number;
  /** True when the goal is 200M XP (skill is already 99). */
  isMaxXp: boolean;
}

/**
 * The player's closest skill achievements — quick wins, ranked by least XP
 * remaining. Purely derived from hiscores XP, so it never recommends
 * something the player can't actually do.
 */
export function nearestMilestones(hiscores: HiscoreData, count = 5): Milestone[] {
  const out: Milestone[] = [];
  for (const skill of hiscores.skills) {
    if (skill.name === "Overall") continue;
    if (skill.xp == null || skill.xp < 0 || skill.level < 1) continue;
    if (skill.level < 99) {
      const target = LEVEL_MILESTONES.find((m) => m > skill.level) ?? 99;
      const xpToGo = xpForLevel(target) - skill.xp;
      if (xpToGo <= 0) continue;
      out.push({ skill, label: `Level ${target}`, target, xpToGo, isMaxXp: false });
    } else if (skill.xp < MAX_SKILL_XP) {
      out.push({
        skill,
        label: "200M XP",
        target: 200,
        xpToGo: MAX_SKILL_XP - skill.xp,
        isMaxXp: true,
      });
    }
  }
  out.sort((a, b) => a.xpToGo - b.xpToGo);
  return out.slice(0, count);
}
