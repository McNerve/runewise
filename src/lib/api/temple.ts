import { fetchJson } from "./client";

const TEMPLE_BASE = "https://templeosrs.com/api";
const CLOG_TTL = 10 * 60 * 1000; // 10 minutes

export interface TempleCollectionItem {
  id: number;
  name?: string;
  count: number;
  obtained_at?: string;
}

export interface TempleCollectionLog {
  total: number;
  finished: number;
  categories: Record<string, TempleCollectionItem[]>;
}

export interface TemplePetData {
  pets: Record<string, 0 | 1>;
  total: number;
  count: number;
}

export interface TemplePlayerInfo {
  username: string;
  country: string | null;
  game_mode: string;
  clog_synced: boolean;
}

export async function fetchTemplePlayerInfo(
  rsn: string
): Promise<TemplePlayerInfo | null> {
  try {
    return await fetchJson<TemplePlayerInfo>({
      url: `${TEMPLE_BASE}/player_info.php?player=${encodeURIComponent(rsn)}`,
      cacheKey: `temple-player-info:${rsn.toLowerCase()}`,
      ttlMs: CLOG_TTL,
      transform: (json) => {
        const data = json as Record<string, unknown>;
        if (data.error) return null as unknown as TemplePlayerInfo;
        const info = data.data as Record<string, unknown> | undefined;
        if (!info) return null as unknown as TemplePlayerInfo;
        return {
          username: String(info.Username ?? rsn),
          country: info.Country ? String(info.Country) : null,
          game_mode: String(info["Game mode"] ?? "Main"),
          clog_synced: Boolean(info["Collection log synced"]),
        };
      },
    });
  } catch {
    return null;
  }
}

export async function fetchTempleCollectionLog(
  rsn: string
): Promise<TempleCollectionLog | null> {
  try {
    return await fetchJson<TempleCollectionLog>({
      url: `${TEMPLE_BASE}/collection-log/player_collection_log.php?player=${encodeURIComponent(rsn)}&categories=all&includenames=true`,
      cacheKey: `temple-clog:${rsn.toLowerCase()}`,
      ttlMs: CLOG_TTL,
      transform: (json) => {
        const data = json as Record<string, unknown>;
        if (data.error) return null as unknown as TempleCollectionLog;
        const clog = data.data as Record<string, unknown> | undefined;
        if (!clog) return null as unknown as TempleCollectionLog;

        const categories: Record<string, TempleCollectionItem[]> = {};
        const items = clog.items as Record<string, Record<string, unknown>> | undefined;

        if (items) {
          for (const [id, item] of Object.entries(items)) {
            const cat = String(item.category ?? "Other");
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push({
              id: parseInt(id, 10),
              name: item.name ? String(item.name) : undefined,
              count: Number(item.count ?? 0),
              obtained_at: item.obtained_at ? String(item.obtained_at) : undefined,
            });
          }
        }

        return {
          total: Number(clog.total ?? 0),
          finished: Number(clog.finished ?? 0),
          categories,
        };
      },
    });
  } catch {
    return null;
  }
}

export async function fetchTemplePets(
  rsn: string
): Promise<TemplePetData | null> {
  try {
    return await fetchJson<TemplePetData>({
      url: `${TEMPLE_BASE}/pets/pet_count.php?player=${encodeURIComponent(rsn)}`,
      cacheKey: `temple-pets:${rsn.toLowerCase()}`,
      ttlMs: CLOG_TTL,
      transform: (json) => {
        const data = json as Record<string, unknown>;
        if (data.error) return null as unknown as TemplePetData;
        const petData = data.data as Record<string, unknown> | undefined;
        if (!petData) return null as unknown as TemplePetData;

        return {
          pets: (petData.pets ?? {}) as Record<string, 0 | 1>,
          total: Number(petData.total ?? 0),
          count: Number(petData.count ?? 0),
        };
      },
    });
  } catch {
    return null;
  }
}
