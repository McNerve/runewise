import type { View } from "./features";
import { SEARCHABLE_FEATURES } from "./features";
import { NAV_ICONS, bossIcon, skillIcon } from "./sprites";
import { loadJSON, saveJSON } from "./localStorage";

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

// ── Search frequency tracking ─────────────────────────────────────────────────
const FREQ_KEY = "runewise_search_frequency";

export function recordSearchClick(name: string, view: View): void {
  const freq = loadJSON<Record<string, number>>(FREQ_KEY, {});
  const key = `${view}:${name}`;
  freq[key] = (freq[key] ?? 0) + 1;
  saveJSON(FREQ_KEY, freq);
}

function loadSearchFrequency(): Record<string, number> {
  return loadJSON<Record<string, number>>(FREQ_KEY, {});
}

function freqKey(result: SearchResult): string {
  return `${result.view}:${result.name}`;
}

export function sortByFrequency(results: SearchResult[]): SearchResult[] {
  const freq = loadSearchFrequency();
  return [...results].sort((a, b) => (freq[freqKey(b)] ?? 0) - (freq[freqKey(a)] ?? 0));
}

// ── Index builder ─────────────────────────────────────────────────────────────

export async function buildSearchIndex(): Promise<SearchResult[]> {
  const [{ BOSSES }, { QUESTS }, { COMBAT_TASKS }, { CLUE_ENTRIES }] = await Promise.all([
    import("./data/bosses"),
    import("./data/quests"),
    import("./data/combat-achievements"),
    import("./data/clues"),
  ]);

  const results: SearchResult[] = [];

  // ── Features (highest priority) ────────────────────────────────────────────
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

  // ── Skills ─────────────────────────────────────────────────────────────────
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

  // ── Bosses ─────────────────────────────────────────────────────────────────
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

  // ── Quests ─────────────────────────────────────────────────────────────────
  for (const quest of QUESTS) {
    results.push({
      name: quest.name,
      category: "Quest",
      kind: quest.difficulty,
      searchText: `${quest.name} quest ${quest.difficulty}`,
      view: "progress",
      params: { tab: "quests", search: quest.name },
      icon: NAV_ICONS.progress,
    });
  }

  // ── Combat tasks ───────────────────────────────────────────────────────────
  for (const task of COMBAT_TASKS) {
    results.push({
      name: task.name,
      category: "Combat Task",
      kind: task.tier,
      searchText: `${task.name} ${task.boss} ${task.tier} combat task achievement`,
      view: "combat-tasks" as View,
      params: { tab: "combat", search: task.name },
      icon: NAV_ICONS["combat-tasks"],
    });
  }

  // ── Clue steps ─────────────────────────────────────────────────────────────
  for (const clue of CLUE_ENTRIES) {
    const hash = btoa(clue.text).replace(/=/g, "").slice(0, 16);
    results.push({
      name: clue.text,
      category: "Clue",
      kind: `${clue.tier} ${clue.type}`,
      searchText: `${clue.text} ${clue.solution} ${clue.location} clue scroll ${clue.tier}`,
      view: "clue-helper",
      params: { search: hash },
      icon: NAV_ICONS["clue-helper"],
    });
  }

  // ── Top GE items (top-500 by trade volume proxy — all items alphabetical cap) ─
  try {
    const { fetchMapping, fetchVolumes } = await import("./api/ge");
    const [mapping, volumes] = await Promise.all([fetchMapping(), fetchVolumes()]);
    const sorted = [...mapping]
      .sort((a, b) => (volumes[String(b.id)] ?? 0) - (volumes[String(a.id)] ?? 0))
      .slice(0, 500);
    for (const item of sorted) {
      results.push({
        name: item.name,
        category: "Item",
        kind: "GE",
        searchText: `${item.name} item grand exchange price`,
        view: "market",
        params: { query: item.name },
      });
    }
  } catch {
    // GE data unavailable — skip item indexing
  }

  return results;
}
