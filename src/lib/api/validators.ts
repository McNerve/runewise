import type { HiscoreData } from "./hiscores";
import { levelForXp } from "../formulas/xp";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function parseHiscoreData(input: unknown): HiscoreData {
  if (!isRecord(input)) {
    throw new Error("Unexpected Hiscores response");
  }

  const skillsRaw = Array.isArray(input.skills) ? input.skills : [];
  const activitiesRaw = Array.isArray(input.activities) ? input.activities : [];

  return {
    skills: skillsRaw
      .filter(isRecord)
      .map((skill, index) => {
        // Unranked skills come back as level/xp = -1. Clamp xp to >= 0 and
        // derive a sane level so they don't subtract from total/combat level.
        const xp = Math.max(0, asNumber(skill.xp, 0));
        const rawLevel = asNumber(skill.level, 1);
        const level = rawLevel >= 1 ? rawLevel : Math.max(1, levelForXp(xp));
        return {
          id: asNumber(skill.id, index),
          name: asString(skill.name, `Skill ${index + 1}`),
          rank: asNumber(skill.rank, -1),
          level,
          xp,
        };
      }),
    activities: activitiesRaw
      .filter(isRecord)
      .map((activity, index) => ({
        id: asNumber(activity.id, index),
        name: asString(activity.name, `Activity ${index + 1}`),
        rank: asNumber(activity.rank, -1),
        score: asNumber(activity.score, 0),
      })),
  };
}
