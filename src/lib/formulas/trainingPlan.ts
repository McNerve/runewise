import { TRAINING_METHODS, type TrainingMethod, type TrainingIntensity } from "../data/training-methods";
import { xpForLevel } from "./xp";

export type TrainingPreference = "fastest" | "afk" | "cheapest";

export interface PlanStep {
  skill: string;
  method: TrainingMethod;
  fromLevel: number;
  toLevel: number;
  xpNeeded: number;
  actions: number;
  hours: number;
  alternatives: TrainingMethod[];
}

export interface TrainingPlan {
  steps: PlanStep[];
  totalHours: number;
  skills: string[];
}

const AFK_INTENSITIES: TrainingIntensity[] = ["afk", "low"];

function scoreMethod(method: TrainingMethod, preference: TrainingPreference): number {
  const xpHr = method.xpPerHour ?? 0;
  if (preference === "fastest") return xpHr;
  if (preference === "afk") {
    // Prefer afk/low intensity — penalize medium/high
    const intensityBonus = AFK_INTENSITIES.includes(method.intensity ?? "medium") ? 2 : 0;
    return xpHr * (1 + intensityBonus);
  }
  if (preference === "cheapest") {
    // Prefer methods with no items (no itemId) or lower cost
    const costPenalty = method.itemId ? 0.5 : 1;
    return xpHr * costPenalty;
  }
  return xpHr;
}

export function generatePlan(
  currentLevels: Record<string, number>,
  targetLevels: Record<string, number>,
  preference: TrainingPreference = "fastest",
  ironmanMode = false
): TrainingPlan {
  const steps: PlanStep[] = [];

  for (const [skill, target] of Object.entries(targetLevels)) {
    const current = currentLevels[skill] ?? 1;
    if (current >= target) continue;

    const methods = TRAINING_METHODS[skill];
    if (!methods || methods.length === 0) continue;

    const xpNeeded = xpForLevel(target) - xpForLevel(current);
    if (xpNeeded <= 0) continue;

    // Find the best available method at the current level given the preference
    const available = methods
      .filter((m) => (m.levelReq ?? 1) <= current && m.xpPerHour && m.xpPerHour > 0)
      .filter((m) => !ironmanMode || m.ironmanViable !== false)
      .sort((a, b) => scoreMethod(b, preference) - scoreMethod(a, preference));

    const method = available[0];
    if (!method || !method.xpPerHour) continue;

    const actions = Math.ceil(xpNeeded / method.xp);
    const hours = xpNeeded / method.xpPerHour;

    steps.push({
      skill,
      method,
      fromLevel: current,
      toLevel: target,
      xpNeeded,
      actions,
      hours,
      alternatives: available,
    });
  }

  steps.sort((a, b) => b.hours - a.hours);

  return {
    steps,
    totalHours: steps.reduce((sum, s) => sum + s.hours, 0),
    skills: steps.map((s) => s.skill),
  };
}
