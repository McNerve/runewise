import { fetchJson } from "./client";
import { isTauri } from "../env";

const WIKISYNC_BASE = isTauri
  ? "https://sync.runescape.wiki"
  : "/api/wikisync";

const WIKISYNC_TTL = 10 * 60 * 1000; // 10 minutes

export interface WikiSyncData {
  quests?: Record<string, number>; // quest name → status (0=not started, 1=in progress, 2=completed)
  achievement_diaries?: Record<string, number>;
  combat_achievements?: string[]; // completed achievement names
  collection_log?: {
    tabs?: Record<string, Record<string, number[]>>; // category → subcategory → item IDs
  };
  music_tracks?: Record<string, boolean>;
  last_updated?: string;
}

export async function fetchWikiSyncData(rsn: string): Promise<WikiSyncData | null> {
  try {
    const encoded = encodeURIComponent(rsn);
    return await fetchJson<WikiSyncData>({
      url: `${WIKISYNC_BASE}/runelite/player/${encoded}/CURRENT`,
      cacheKey: `wikisync:${rsn}`,
      ttlMs: WIKISYNC_TTL,
    });
  } catch {
    console.warn("[RuneWise] Wiki Sync data not available for", rsn);
    return null;
  }
}

export async function fetchWikiSyncQuests(rsn: string): Promise<Record<string, number> | null> {
  const data = await fetchWikiSyncData(rsn);
  return data?.quests ?? null;
}

export async function fetchWikiSyncCollectionLog(rsn: string): Promise<WikiSyncData["collection_log"] | null> {
  const data = await fetchWikiSyncData(rsn);
  return data?.collection_log ?? null;
}

export async function fetchWikiSyncCombatAchievements(rsn: string): Promise<string[] | null> {
  const data = await fetchWikiSyncData(rsn);
  return data?.combat_achievements ?? null;
}
