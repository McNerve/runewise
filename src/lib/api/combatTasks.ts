import { bucketQueryAll } from "./bucket";
import { getCached, setCache } from "./cache";
import {
  COMBAT_TASKS,
  type CombatTask,
  type CombatTier,
} from "../data/combat-achievements";

const CACHE_KEY = "wiki-combat-tasks:v1";
const CACHE_TTL = 24 * 60 * 60 * 1000;

const TASK_FIELDS = ["name", "monster", "task", "tier", "type"] as const;

interface RawCombatTask {
  [key: string]: unknown;
  name?: string;
  monster?: string;
  task?: string;
  tier?: string;
  type?: string;
}

const VALID_TIERS: ReadonlySet<CombatTier> = new Set([
  "Easy",
  "Medium",
  "Hard",
  "Elite",
  "Master",
  "Grandmaster",
]);

export interface WikiCombatTask extends CombatTask {
  type: string;
}

function toTask(raw: RawCombatTask): WikiCombatTask | null {
  const name = (raw.name ?? "").trim();
  if (!name) return null;

  const tier = (raw.tier ?? "").trim();
  if (!VALID_TIERS.has(tier as CombatTier)) return null;

  const boss = (raw.monster ?? "").trim() || "Other";
  const description = (raw.task ?? "").trim();
  const type = (raw.type ?? "").trim();

  return {
    name,
    tier: tier as CombatTier,
    boss,
    description,
    type,
  };
}

/**
 * Merge hardcoded curated tasks with wiki-sourced tasks.
 * Wiki data is authoritative; curated tasks supply boss-mapping hints
 * (same-name tasks) for entries the wiki flags as "Other" or a less-specific
 * monster label. For now we de-dupe on task name (case-insensitive).
 */
export function mergeTasks(
  wikiTasks: WikiCombatTask[],
  curated: CombatTask[]
): WikiCombatTask[] {
  const byKey = new Map<string, WikiCombatTask>();
  for (const t of wikiTasks) {
    byKey.set(t.name.toLowerCase(), t);
  }
  for (const c of curated) {
    const key = c.name.toLowerCase();
    if (!byKey.has(key)) {
      byKey.set(key, { ...c, type: "" });
    }
  }
  return [...byKey.values()];
}

let inflight: Promise<WikiCombatTask[]> | null = null;

export async function fetchAllCombatTasks(): Promise<WikiCombatTask[]> {
  const cached = getCached<WikiCombatTask[]>(CACHE_KEY, CACHE_TTL, {
    persist: true,
  });
  if (cached && cached.length > 0) return cached;

  if (!inflight) {
    inflight = bucketQueryAll<RawCombatTask>("combat_achievement", [
      ...TASK_FIELDS,
    ])
      .then((raw) => {
        const wiki = raw
          .map(toTask)
          .filter((t): t is WikiCombatTask => t !== null);
        const merged = mergeTasks(wiki, COMBAT_TASKS);
        if (merged.length > 0) {
          setCache(CACHE_KEY, merged, { persist: true });
        }
        inflight = null;
        return merged;
      })
      .catch((err: unknown) => {
        inflight = null;
        console.error("[RuneWise] Failed to fetch combat tasks:", err);
        throw err;
      });
  }

  return inflight;
}

export function tierCounts(
  tasks: WikiCombatTask[]
): Record<CombatTier, number> {
  const counts: Record<CombatTier, number> = {
    Easy: 0,
    Medium: 0,
    Hard: 0,
    Elite: 0,
    Master: 0,
    Grandmaster: 0,
  };
  for (const t of tasks) counts[t.tier] += 1;
  return counts;
}
