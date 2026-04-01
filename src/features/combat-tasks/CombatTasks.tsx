import { useState, useMemo } from "react";
import {
  COMBAT_TASKS,
  COMBAT_TIERS,
  COMBAT_TIER_COUNTS,
  type CombatTier,
} from "../../lib/data/combat-achievements";
import { type HiscoreData } from "../../lib/api/hiscores";

interface Props {
  hiscores: HiscoreData | null;
}

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

export default function CombatTasks({ hiscores }: Props) {
  const [selectedTier, setSelectedTier] = useState<CombatTier>("Easy");
  const [search, setSearch] = useState("");

  const completedTotal = useMemo(() => {
    if (!hiscores) return null;
    const ca = hiscores.activities.find((a) =>
      a.name.toLowerCase().includes("combat achievement")
    );
    return ca?.score ?? 0;
  }, [hiscores]);

  const totalTasks = Object.values(COMBAT_TIER_COUNTS).reduce(
    (sum, n) => sum + n,
    0
  );

  const tierTasks = useMemo(() => {
    let tasks = COMBAT_TASKS.filter((t) => t.tier === selectedTier);

    if (search.length >= 2) {
      const s = search.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.name.toLowerCase().includes(s) ||
          t.boss.toLowerCase().includes(s) ||
          t.description.toLowerCase().includes(s)
      );
    }

    return tasks;
  }, [selectedTier, search]);

  const groupedByBoss = useMemo(() => {
    const groups: Record<string, typeof tierTasks> = {};
    for (const task of tierTasks) {
      if (!groups[task.boss]) groups[task.boss] = [];
      groups[task.boss].push(task);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [tierTasks]);

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-semibold mb-1">
        Combat Achievements Tracker
      </h2>
      {completedTotal !== null ? (
        <div className="flex items-center gap-3 mb-4">
          <p className="text-xs text-text-secondary">
            {completedTotal}/{totalTasks} completed
          </p>
          <div className="flex-1 max-w-[200px] h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{
                width: `${(completedTotal / totalTasks) * 100}%`,
              }}
            />
          </div>
          <span className="text-[10px] text-text-secondary">
            {((completedTotal / totalTasks) * 100).toFixed(1)}%
          </span>
        </div>
      ) : (
        <p className="text-xs text-text-secondary mb-4">
          {totalTasks} total tasks across 6 tiers
        </p>
      )}

      {/* Tier tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {COMBAT_TIERS.map((tier) => {
          const isActive = selectedTier === tier;
          const colors = TIER_COLORS[tier];
          return (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                isActive ? colors.tab : TIER_INACTIVE
              }`}
            >
              {tier}
              <span className="ml-1.5 opacity-60">
                {COMBAT_TIER_COUNTS[tier]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search tasks, bosses..."
        className="w-full bg-bg-secondary border border-border rounded px-3 py-1.5 text-sm mb-4"
      />

      {/* Task count for current tier */}
      <p className="text-xs text-text-secondary mb-3">
        Showing {tierTasks.length} of {COMBAT_TIER_COUNTS[selectedTier]}{" "}
        {selectedTier} tasks
        {tierTasks.length < COMBAT_TIER_COUNTS[selectedTier] && !search && (
          <span className="text-text-secondary/50">
            {" "}
            (representative sample)
          </span>
        )}
      </p>

      {/* Tasks grouped by boss */}
      <div className="space-y-4">
        {groupedByBoss.map(([boss, tasks]) => (
          <div key={boss}>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${TIER_COLORS[selectedTier].badge}`}
              >
                {boss}
              </span>
              <span className="text-[10px] text-text-secondary/40">
                {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
              </span>
            </div>
            <div className="space-y-1">
              {tasks.map((task) => (
                <div
                  key={task.name}
                  className="bg-bg-secondary rounded-lg px-4 py-2.5 hover:bg-bg-tertiary transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-sm font-medium">{task.name}</span>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {task.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {groupedByBoss.length === 0 && (
        <p className="text-sm text-text-secondary text-center py-8">
          No tasks match your search.
        </p>
      )}

      {!hiscores && (
        <p className="text-sm text-text-secondary mt-4">
          Look up your RSN above to see your combat achievement progress.
        </p>
      )}
    </div>
  );
}
