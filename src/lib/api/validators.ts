import type { HiscoreData } from "./hiscores";

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
      .map((skill, index) => ({
        id: asNumber(skill.id, index),
        name: asString(skill.name, `Skill ${index + 1}`),
        rank: asNumber(skill.rank, -1),
        level: asNumber(skill.level, 1),
        xp: asNumber(skill.xp, 0),
      })),
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
