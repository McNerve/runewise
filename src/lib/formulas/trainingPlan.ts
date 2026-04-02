import { TRAINING_METHODS, type TrainingMethod } from "../data/training-methods";
import { xpForLevel } from "./xp";

export interface PlanStep {
  skill: string;
  method: TrainingMethod;
  fromLevel: number;
  toLevel: number;
  xpNeeded: number;
  actions: number;
  hours: number;
}

export interface TrainingPlan {
  steps: PlanStep[];
  totalHours: number;
  skills: string[];
}

export function generatePlan(
  currentLevels: Record<string, number>,
  targetLevels: Record<string, number>
): TrainingPlan {
  const steps: PlanStep[] = [];

  for (const [skill, target] of Object.entries(targetLevels)) {
    const current = currentLevels[skill] ?? 1;
    if (current >= target) continue;

    const methods = TRAINING_METHODS[skill];
    if (!methods || methods.length === 0) continue;

    const xpNeeded = xpForLevel(target) - xpForLevel(current);
    if (xpNeeded <= 0) continue;

    // Find the best available method at the current level
    const available = methods
      .filter((m) => (m.levelReq ?? 1) <= current && m.xpPerHour && m.xpPerHour > 0)
      .sort((a, b) => (b.xpPerHour ?? 0) - (a.xpPerHour ?? 0));

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
    });
  }

  steps.sort((a, b) => b.hours - a.hours);

  return {
    steps,
    totalHours: steps.reduce((sum, s) => sum + s.hours, 0),
    skills: steps.map((s) => s.skill),
  };
}
