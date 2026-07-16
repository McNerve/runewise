import type { TrainingMethod } from "../../lib/data/training-methods";
import { xpForLevel } from "../../lib/formulas/xp";

export const SKILLS = [
  "Attack",
  "Strength",
  "Defence",
  "Ranged",
  "Prayer",
  "Magic",
  "Runecraft",
  "Hitpoints",
  "Crafting",
  "Mining",
  "Smithing",
  "Fishing",
  "Cooking",
  "Firemaking",
  "Woodcutting",
  "Agility",
  "Herblore",
  "Thieving",
  "Fletching",
  "Slayer",
  "Farming",
  "Construction",
  "Hunter",
  "Sailing",
] as const;

export type SkillName = (typeof SKILLS)[number];

export function normalizeSkill(name: string | undefined | null): SkillName | null {
  if (!name) return null;
  const match = SKILLS.find((s) => s.toLowerCase() === name.toLowerCase());
  return match ?? null;
}

/** Clamp skill-calc target levels to the interactive range (2–99). */
export function clampTargetLevel(value: number): number {
  if (!Number.isFinite(value)) return 2;
  return Math.max(2, Math.min(99, Math.round(value)));
}

/**
 * Default target when switching skills: next level if under 99, else 99.
 * Custom targets take priority when provided.
 */
export function defaultTargetLevel(
  currentLevel: number | null,
  customTarget?: number
): number {
  if (customTarget !== undefined) return clampTargetLevel(customTarget);
  if (currentLevel !== null && currentLevel < 99) {
    return clampTargetLevel(currentLevel + 1);
  }
  return 99;
}

export function computeXpNeeded(
  currentXp: number,
  targetLevel: number,
  chaseMaxXp = false
): { targetXp: number; xpNeeded: number } {
  const targetXp = chaseMaxXp ? 200_000_000 : xpForLevel(clampTargetLevel(targetLevel));
  const xpNeeded = Math.max(0, targetXp - Math.max(0, currentXp));
  return { targetXp, xpNeeded };
}

export function filterMethodsByIntensity(
  methods: TrainingMethod[],
  intensityFilter: string
): TrainingMethod[] {
  if (intensityFilter === "All" || !intensityFilter) return methods;
  const key = intensityFilter.toLowerCase();
  return methods.filter((m) => (m.intensity ?? "").toLowerCase() === key);
}

/** Actions required (ceil) for a method given remaining XP. */
export function actionsForXp(xpNeeded: number, xpPerAction: number): number {
  if (xpPerAction <= 0 || xpNeeded <= 0) return 0;
  return Math.ceil(xpNeeded / xpPerAction);
}

/** Hours estimate from remaining XP and XP/hr. */
export function hoursForXp(xpNeeded: number, xpPerHour: number | undefined): number | null {
  if (!xpPerHour || xpPerHour <= 0 || xpNeeded <= 0) return null;
  return xpNeeded / xpPerHour;
}
