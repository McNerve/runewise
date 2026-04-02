import type { View } from "./features";
import { SEARCHABLE_FEATURES } from "./features";
import { NAV_ICONS, bossIcon, skillIcon } from "./sprites";

export interface SearchResult {
  name: string;
  category: string;
  kind?: string;
  searchText?: string;
  view: View;
  params?: Record<string, string>;
  icon?: string;
}

const SKILLS = [
  "Attack", "Strength", "Defence", "Ranged", "Prayer", "Magic",
  "Runecraft", "Hitpoints", "Crafting", "Mining", "Smithing", "Fishing",
  "Cooking", "Firemaking", "Woodcutting", "Agility", "Herblore", "Thieving",
  "Fletching", "Slayer", "Farming", "Construction", "Hunter", "Sailing",
];

export async function buildSearchIndex(): Promise<SearchResult[]> {
  const [{ BOSSES }] = await Promise.all([
    import("./data/bosses"),
  ]);

  const results: SearchResult[] = [];

  for (const skill of SKILLS) {
    results.push({
      name: skill,
      category: "Skill",
      kind: "Calculator",
      searchText: `${skill} skill calculator training`,
      view: "skill-calc",
      params: { skill: skill.toLowerCase() },
      icon: skillIcon(skill),
    });
  }

  for (const boss of BOSSES) {
    results.push({
      name: boss.name,
      category: "Boss",
      kind: "Workspace",
      searchText: `${boss.name} boss guide drops tasks combat`,
      view: "bosses",
      params: { boss: boss.name },
      icon: bossIcon(boss.name),
    });
  }

  results.push(
    ...SEARCHABLE_FEATURES.map((feature) => ({
      name: feature.title,
      category: feature.family,
      kind: "View",
      searchText: `${feature.title} ${feature.navLabel} ${feature.aliases.join(" ")}`,
      view: feature.id,
      icon: NAV_ICONS[feature.id],
    }))
  );

  results.push({
    name: "Search items in Market",
    category: "Shortcut",
    kind: "Workspace",
    searchText: "items market ge prices grand exchange",
    view: "market",
    icon: NAV_ICONS.market,
  });

  return results;
}
