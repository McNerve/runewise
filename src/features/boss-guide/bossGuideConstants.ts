export type BossWorkspaceTab = "guide" | "drops" | "tasks";

export const BOSS_WORKSPACE_TABS: Array<{
  id: BossWorkspaceTab;
  label: string;
  description: string;
}> = [
  { id: "guide", label: "Strategy", description: "Mechanics, requirements, gear" },
  { id: "drops", label: "Loot & Drops", description: "Uniques, value, drop groups" },
  { id: "tasks", label: "Task Planner", description: "Boss-linked CA reference" },
];

export const CATEGORY_LABELS: Record<string, string> = {
  All: "All bosses",
  Raids: "Raid encounters",
  GWD: "God Wars Dungeon",
  Slayer: "Slayer bosses",
  Wilderness: "Wilderness bosses",
  Other: "Other bosses",
  Varlamore: "Varlamore",
  Sailing: "Sailing",
};
