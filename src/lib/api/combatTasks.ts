import { bucketQueryAll } from "./bucket";
import { getCached, setCache } from "./cache";
import type { CombatTier } from "../data/combat-achievements";

const CACHE_KEY = "wiki-combat-tasks:v1";
const CACHE_TTL = 24 * 60 * 60 * 1000;

// OSRS Wiki `combat_achievement` bucket fields
const COMBAT_TASK_FIELDS = [
  "page_name",
  "name",
  "tier",
  "monster",
  "description",
  "type",
] as const;

interface RawBucketCombatTask {
  [key: string]: unknown;
  page_name?: string;
  name?: string | string[];
  tier?: string | string[];
  monster?: string | string[];
  description?: string | string[];
  type?: string | string[];
}

export interface WikiCombatTask {
  name: string;
  tier: CombatTier;
  boss: string;
  description: string;
  type: string;
}

const VALID_TIERS: readonly CombatTier[] = [
  "Easy",
  "Medium",
  "Hard",
  "Elite",
  "Master",
  "Grandmaster",
];

function normalizeTier(raw: string | undefined): CombatTier | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  for (const tier of VALID_TIERS) {
    if (tier.toLowerCase() === lower) return tier;
  }
  return null;
}

function first(v: string | string[] | undefined): string {
  if (!v) return "";
  return Array.isArray(v) ? (v[0] ?? "") : v;
}

function toWikiCombatTask(raw: RawBucketCombatTask): WikiCombatTask | null {
  const name = first(raw.name) || raw.page_name || "";
  const tier = normalizeTier(first(raw.tier));
  const boss = first(raw.monster);
  const description = first(raw.description);
  const type = first(raw.type);

  if (!name || !tier) return null;

  return {
    name: name.trim(),
    tier,
    boss: boss.trim() || "Misc",
    description: description.trim(),
    type: type.trim(),
  };
}

let tasksPromise: Promise<WikiCombatTask[]> | null = null;

export async function fetchAllCombatTasks(): Promise<WikiCombatTask[]> {
  const cached = getCached<WikiCombatTask[]>(CACHE_KEY, CACHE_TTL, { persist: true });
  if (cached) return cached;

  if (!tasksPromise) {
    tasksPromise = bucketQueryAll<RawBucketCombatTask>(
      "combat_achievement",
      [...COMBAT_TASK_FIELDS]
    )
      .then((raw) => {
        const tasks = raw
          .map(toWikiCombatTask)
          .filter((t): t is WikiCombatTask => t !== null);

        // De-dupe by name (wiki occasionally has per-page duplicates)
        const seen = new Set<string>();
        const unique: WikiCombatTask[] = [];
        for (const t of tasks) {
          const key = t.name.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          unique.push(t);
        }

        if (unique.length > 0) setCache(CACHE_KEY, unique, { persist: true });
        tasksPromise = null;
        return unique;
      })
      .catch((err: unknown) => {
        tasksPromise = null;
        console.error("[RuneWise] Failed to fetch combat tasks:", err);
        throw err;
      });
  }

  return tasksPromise;
}
