import type { Quest } from "../../lib/data/quests";
import type { HiscoreData } from "../../lib/api/hiscores";

export type QuestReqStatus = "met" | "missing" | "unknown";

export function checkRequirements(
  quest: Quest,
  hiscores: HiscoreData | null
): {
  met: boolean;
  status: QuestReqStatus;
  missing: { skill: string; required: number; current: number }[];
} {
  // No hiscores → unknown (never default to green "met")
  if (!hiscores) {
    return { met: false, status: "unknown", missing: [] };
  }
  if (quest.skillRequirements.length === 0) {
    return { met: true, status: "met", missing: [] };
  }

  const missing: { skill: string; required: number; current: number }[] = [];
  for (const req of quest.skillRequirements) {
    const skill = hiscores.skills.find(
      (s) => s.name.toLowerCase() === req.skill.toLowerCase()
    );
    const current = skill?.level ?? 1;
    if (current < req.level) {
      missing.push({ skill: req.skill, required: req.level, current });
    }
  }

  const ok = missing.length === 0;
  return { met: ok, status: ok ? "met" : "missing", missing };
}
