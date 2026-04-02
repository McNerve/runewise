import type { Quest } from "../data/quests";
import type { HiscoreData } from "../api/hiscores";

export type EligibilityStatus = "ready" | "almost" | "locked";

export interface QuestEligibility {
  quest: Quest;
  status: EligibilityStatus;
  metRequirements: number;
  totalRequirements: number;
  unmetSkills: Array<{ skill: string; current: number; required: number; gap: number }>;
  maxGap: number;
}

function getLevel(hiscores: HiscoreData, skill: string): number {
  return (
    hiscores.skills.find(
      (s) => s.name.toLowerCase() === skill.toLowerCase()
    )?.level ?? 1
  );
}

export function checkQuestEligibility(
  quest: Quest,
  hiscores: HiscoreData
): QuestEligibility {
  const total = quest.skillRequirements.length;
  const unmetSkills: QuestEligibility["unmetSkills"] = [];

  for (const req of quest.skillRequirements) {
    const current = getLevel(hiscores, req.skill);
    if (current < req.level) {
      unmetSkills.push({
        skill: req.skill,
        current,
        required: req.level,
        gap: req.level - current,
      });
    }
  }

  const met = total - unmetSkills.length;
  const maxGap = unmetSkills.length > 0
    ? Math.max(...unmetSkills.map((u) => u.gap))
    : 0;

  let status: EligibilityStatus;
  if (unmetSkills.length === 0) {
    status = "ready";
  } else if (maxGap <= 5) {
    status = "almost";
  } else {
    status = "locked";
  }

  return { quest, status, metRequirements: met, totalRequirements: total, unmetSkills, maxGap };
}

export function checkAllQuests(
  quests: Quest[],
  hiscores: HiscoreData
): QuestEligibility[] {
  return quests.map((q) => checkQuestEligibility(q, hiscores));
}
