import { useEffect, useMemo, useState } from "react";
import {
  COMBAT_TASKS,
  COMBAT_TIERS,
  COMBAT_TIER_COUNTS,
  type CombatTask,
  type CombatTier,
} from "../../lib/data/combat-achievements";
import { fetchAllCombatTasks, type WikiCombatTask } from "../../lib/api/combatTasks";
import { useNavigation } from "../../lib/NavigationContext";
import { findBossByName } from "../../lib/data/bosses";
import EmptyState from "../../components/EmptyState";
import { loadJSON, saveJSON } from "../../lib/localStorage";

const TIER_COLORS: Record<CombatTier, { tab: string; badge: string }> = {
  Easy: {
    tab: "bg-success/20 text-success",
    badge: "bg-success/15 text-success",
  },
  Medium: {
    tab: "bg-blue-500/20 text-blue-400",
    badge: "bg-blue-500/15 text-blue-400",
  },
  Hard: {
    tab: "bg-danger/20 text-danger",
    badge: "bg-danger/15 text-danger",
  },
  Elite: {
    tab: "bg-purple-500/20 text-purple-400",
    badge: "bg-purple-500/15 text-purple-400",
  },
  Master: {
    tab: "bg-orange-500/20 text-orange-400",
    badge: "bg-orange-500/15 text-orange-400",
  },
  Grandmaster: {
    tab: "bg-yellow-500/20 text-yellow-300",
    badge: "bg-yellow-500/15 text-yellow-300",
  },
};

const TIER_INACTIVE =
  "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary";

const COMPLETED_KEY = "runewise_completed_combat_tasks";

/**
 * Merge wiki data with hardcoded tasks: wiki covers all 637 tasks, hardcoded
 * entries hold boss-workspace link targets. We key by case-insensitive name.
 */
function mergeTasks(
  wiki: WikiCombatTask[],
  hardcoded: CombatTask[]
): CombatTask[] {
  const hardcodedByName = new Map<string, CombatTask>();
  for (const task of hardcoded) {
    hardcodedByName.set(task.name.toLowerCase(), task);
  }

  return wiki.map((w) => {
    const hc = hardcodedByName.get(w.name.toLowerCase());
    // Prefer hardcoded boss mapping (which aligns with BOSSES registry) when available
    return {
      name: w.name,
      tier: w.tier,
      boss: hc?.boss ?? w.boss,
      description: w.description || hc?.description || "",
    };
  });
}

export default function CombatTasks() {
  const { params, navigate } = useNavigation();
  const [selectedTier, setSelectedTier] = useState<CombatTier>("Easy");
  const [search, setSearch] = useState(params.search ?? "");
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(
    () => new Set(loadJSON<string[]>(COMPLETED_KEY, []))
  );
  const [hideCompleted, setHideCompleted] = useState(false);
  const [wikiTasks, setWikiTasks] = useState<CombatTask[] | null>(null);
  const [wikiLoading, setWikiLoading] = useState(true);
  const [wikiFailed, setWikiFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchAllCombatTasks()
      .then((tasks) => {
        if (cancelled) return;
        setWikiTasks(mergeTasks(tasks, COMBAT_TASKS));
        setWikiLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setWikiFailed(true);
        setWikiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleTask(taskName: string) {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskName)) next.delete(taskName);
      else next.add(taskName);
      saveJSON(COMPLETED_KEY, [...next]);
      return next;
    });
  }

  const activeTasks: CombatTask[] = wikiTasks ?? COMBAT_TASKS;
  const usingWiki = wikiTasks !== null;

  const tierCountsActual = useMemo(() => {
    const counts: Record<CombatTier, number> = {
      Easy: 0,
      Medium: 0,
      Hard: 0,
      Elite: 0,
      Master: 0,
      Grandmaster: 0,
    };
    for (const t of activeTasks) counts[t.tier]++;
    return counts;
  }, [activeTasks]);

  const totalTasks = usingWiki
    ? activeTasks.length
    : Object.values(COMBAT_TIER_COUNTS).reduce((sum, n) => sum + n, 0);

  const tierTasks = useMemo(() => {
    let tasks = activeTasks.filter((t) => t.tier === selectedTier);

    if (search.length >= 2) {
      const s = search.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.name.toLowerCase().includes(s) ||
          t.boss.toLowerCase().includes(s) ||
          t.description.toLowerCase().includes(s)
      );
    }

    if (hideCompleted) tasks = tasks.filter((t) => !completedTasks.has(t.name));

    return tasks;
  }, [activeTasks, selectedTier, search, hideCompleted, completedTasks]);

  const tierCompletedCount = useMemo(() => {
    const all = activeTasks.filter((t) => t.tier === selectedTier);
    return all.filter((t) => completedTasks.has(t.name)).length;
  }, [activeTasks, selectedTier, completedTasks]);

  const groupedByBoss = useMemo(() => {
    const groups: Record<string, typeof tierTasks> = {};
    for (const task of tierTasks) {
      if (!groups[task.boss]) groups[task.boss] = [];
      groups[task.boss].push(task);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [tierTasks]);

  const tierTotalForSelected = usingWiki
    ? tierCountsActual[selectedTier]
    : COMBAT_TIER_COUNTS[selectedTier];

  return (
    <div className="max-w-4xl">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-1">
          Combat Tasks Reference
        </h2>
        <p className="text-sm text-text-secondary">
          Boss-linked combat achievement tasks for planning runs, checking requirements,
          and jumping into related boss workflows. Task completion is not synced from an
          official API.
        </p>
        <p className="mt-2 text-xs text-text-secondary">
          {wikiLoading
            ? "Loading full task list from the OSRS Wiki…"
            : usingWiki
              ? `${totalTasks} tasks loaded from the OSRS Wiki across 6 tiers.`
              : `Showing ${totalTasks} curated tasks — wiki unavailable.`}
        </p>
        {wikiFailed && !usingWiki && (
          <p className="mt-1 text-xs text-warning">
            Could not reach the OSRS Wiki. Falling back to the curated sample.
          </p>
        )}
      </div>

      {/* Tier tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {COMBAT_TIERS.map((tier) => {
          const isActive = selectedTier === tier;
          const colors = TIER_COLORS[tier];
          const count = usingWiki
            ? tierCountsActual[tier]
            : COMBAT_TIER_COUNTS[tier];
          return (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                isActive ? colors.tab : TIER_INACTIVE
              }`}
            >
              {tier}
              <span className="ml-1.5 opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search + controls */}
      <div className="flex gap-2 items-center mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks, bosses..."
          className="flex-1 bg-bg-secondary border border-border rounded px-3 py-1.5 text-sm"
        />
        <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={hideCompleted}
            onChange={(e) => setHideCompleted(e.target.checked)}
            className="accent-accent"
          />
          Hide completed
        </label>
      </div>

      {/* Task count for current tier */}
      <div className="section-kicker mb-3 flex items-center gap-2">
        <span>
          Showing {tierTasks.length} of {tierTotalForSelected}{" "}
          {selectedTier} tasks
        </span>
        {tierCompletedCount > 0 && (
          <span className="text-success opacity-70">
            · {tierCompletedCount}/{tierTotalForSelected} completed
          </span>
        )}
      </div>

      {/* Tasks grouped by boss */}
      <div className="space-y-4">
        {groupedByBoss.map(([boss, tasks]) => (
          <div key={boss}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${TIER_COLORS[selectedTier].badge}`}
              >
                {boss}
              </span>
              <span className="text-[10px] text-text-secondary/40">
                {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
              </span>
              {findBossByName(boss) ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate("bosses", { boss, tab: "tasks" })}
                    className="text-[10px] text-accent transition hover:text-accent-hover"
                  >
                    Boss Workspace
                  </button>
                  <span className="text-[10px] text-text-secondary/25">•</span>
                  <button
                    type="button"
                    onClick={() => navigate("bosses", { boss, tab: "drops" })}
                    className="text-[10px] text-accent transition hover:text-accent-hover"
                  >
                    Drops
                  </button>
                </>
              ) : null}
            </div>
            <div className="space-y-1">
              {tasks.map((task) => (
                <div
                  key={task.name}
                  className={`bg-bg-secondary rounded-lg px-4 py-2.5 hover:bg-bg-tertiary transition-colors ${
                    completedTasks.has(task.name) ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleTask(task.name); }}
                      className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px] transition-colors mt-0.5 ${
                        completedTasks.has(task.name)
                          ? "bg-success/20 border-success text-success"
                          : "border-border hover:border-accent"
                      }`}
                    >
                      {completedTasks.has(task.name) && "\u2713"}
                    </button>
                    <div className="flex-1">
                      <span className="text-sm font-medium">{task.name}</span>
                      {task.description && (
                        <p className="text-xs text-text-secondary mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {groupedByBoss.length === 0 && !wikiLoading && (
        <EmptyState
          title="No tasks found"
          description={search ? `No tasks match "${search}"` : `No ${selectedTier} tasks available`}
        />
      )}
    </div>
  );
}
