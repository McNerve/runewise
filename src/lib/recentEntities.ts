import type { View } from "./features";
import { loadJSON, saveJSON } from "./localStorage";
import { NAV_ICONS, bossIcon, itemIcon } from "./sprites";

const RECENT_ENTITIES_KEY = "runewise_recent_entities";
const MAX_RECENT_ENTITIES = 12;

export interface RecentEntity {
  id: string;
  name: string;
  category: "Item" | "Boss" | "Wiki" | "Player" | "Quest";
  kind: "Recent";
  view: View;
  params: Record<string, string>;
  icon?: string;
}

function createRecentEntity(
  view: View,
  params: Record<string, string>
): RecentEntity | null {
  if (view === "market" && params.query) {
    return {
      id: `market:${params.query.toLowerCase()}`,
      name: params.query,
      category: "Item",
      kind: "Recent",
      view,
      params: { query: params.query },
      icon: itemIcon(params.query),
    };
  }

  if (view === "bosses" && params.boss) {
    return {
      id: `bosses:${params.boss.toLowerCase()}`,
      name: params.boss,
      category: "Boss",
      kind: "Recent",
      view,
      params: { boss: params.boss, ...(params.tab ? { tab: params.tab } : {}) },
      icon: bossIcon(params.boss),
    };
  }

  if (view === "wiki" && (params.page || params.query)) {
    const page = params.page ?? params.query;
    if (!page) return null;

    return {
      id: `wiki:${page.toLowerCase()}`,
      name: page,
      category: "Wiki",
      kind: "Recent",
      view,
      params: { page, query: page },
      icon: NAV_ICONS.wiki,
    };
  }

  if (view === "lookup" && params.query) {
    return {
      id: `lookup:${params.query.toLowerCase()}`,
      name: params.query,
      category: "Player",
      kind: "Recent",
      view,
      params: { query: params.query },
      icon: NAV_ICONS.lookup,
    };
  }

  if (view === "progress" && params.quest) {
    return {
      id: `progress:${params.quest.toLowerCase()}`,
      name: params.quest,
      category: "Quest",
      kind: "Recent",
      view,
      params: { quest: params.quest, tab: "quests" },
      icon: NAV_ICONS.progress,
    };
  }

  return null;
}

export function loadRecentEntities(): RecentEntity[] {
  return loadJSON<RecentEntity[]>(RECENT_ENTITIES_KEY, []);
}

export function saveRecentEntity(view: View, params: Record<string, string>): void {
  const next = createRecentEntity(view, params);
  if (!next) return;

  const existing = loadRecentEntities().filter((entity) => entity.id !== next.id);
  saveJSON(RECENT_ENTITIES_KEY, [next, ...existing].slice(0, MAX_RECENT_ENTITIES));
}
