import { useState, useMemo, useCallback } from "react";
import { DIARY_REGIONS, type DiaryRegion, type DiaryTier } from "../../lib/data/diaries";
import { type HiscoreData } from "../../lib/api/hiscores";
import { SKILL_ICONS } from "../../lib/sprites";
import { loadJSON, saveJSON } from "../../lib/localStorage";

const TASKS_KEY = "runewise_diary_tasks";

interface Props {
  hiscores: HiscoreData | null;
}

function checkTier(
  tier: DiaryTier,
  hiscores: HiscoreData | null
): { met: number; total: number; missing: { skill: string; required: number; current: number }[] } {
  if (!hiscores) return { met: 0, total: tier.requirements.length, missing: [] };

  const missing: { skill: string; required: number; current: number }[] = [];
  let met = 0;

  for (const req of tier.requirements) {
    const skill = hiscores.skills.find(
      (s) => s.name.toLowerCase() === req.skill.toLowerCase()
    );
    const current = skill?.level ?? 1;
    if (current >= req.level) {
      met++;
    } else {
      missing.push({ skill: req.skill, required: req.level, current });
    }
  }

  return { met, total: tier.requirements.length, missing };
}

function taskKey(region: string, tier: string, taskIdx: number): string {
  return `${region}:${tier}:${taskIdx}`;
}

const TIER_COLORS = {
  Easy: "text-success",
  Medium: "text-warning",
  Hard: "text-danger",
  Elite: "text-purple-400",
};

export default function DiaryTracker({ hiscores }: Props) {
  const [selectedRegion, setSelectedRegion] = useState<DiaryRegion>(DIARY_REGIONS[0]);
  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(() => {
    const data = loadJSON<string[]>(TASKS_KEY, []);
    return new Set(data);
  });

  const toggleTask = useCallback((key: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      saveJSON(TASKS_KEY, [...next]);
      return next;
    });
  }, []);

  const getTaskCount = useCallback(
    (region: string, tier: string, totalTasks: number) => {
      let done = 0;
      for (let i = 0; i < totalTasks; i++) {
        if (completedTasks.has(taskKey(region, tier, i))) done++;
      }
      return done;
    },
    [completedTasks]
  );

  const regionSummaries = useMemo(() => {
    return DIARY_REGIONS.map((region) => {
      const tierStatuses = region.tiers.map((tier) => {
        const check = checkTier(tier, hiscores);
        return { tier: tier.tier, complete: check.missing.length === 0 };
      });
      const completed = tierStatuses.filter((t) => t.complete).length;
      const tasksCompleted = region.tiers.reduce(
        (sum, tier) =>
          sum + getTaskCount(region.name, tier.tier, tier.tasks.length),
        0
      );
      const totalTasks = region.tiers.reduce(
        (sum, tier) => sum + tier.tasks.length,
        0
      );
      return { region: region.name, completed, total: 4, tasksCompleted, totalTasks };
    });
  }, [hiscores, getTaskCount]);

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-semibold mb-4">Achievement Diary Tracker</h2>

      <div className="grid grid-cols-[200px_1fr] gap-4">
        {/* Region list */}
        <div className="space-y-0.5">
          {DIARY_REGIONS.map((region, i) => {
            const summary = regionSummaries[i];
            return (
              <button
                key={region.name}
                onClick={() => {
                  setSelectedRegion(region);
                  setExpandedTier(null);
                }}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  selectedRegion.name === region.name
                    ? "bg-accent/15 text-accent"
                    : "bg-bg-secondary hover:bg-bg-tertiary text-text-secondary"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-text-primary text-xs">
                    {region.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {summary.tasksCompleted > 0 && (
                      <span className="text-[10px] text-text-secondary/50 tabular-nums">
                        {summary.tasksCompleted}/{summary.totalTasks}
                      </span>
                    )}
                    {hiscores && (
                      <span
                        className={`text-[10px] ${
                          summary.completed === 4
                            ? "text-success"
                            : summary.completed > 0
                              ? "text-warning"
                              : "text-text-secondary"
                        }`}
                      >
                        {summary.completed}/4
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tier details */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">{selectedRegion.name}</h3>

          {selectedRegion.tiers.map((tier) => {
            const check = checkTier(tier, hiscores);
            const isExpanded = expandedTier === tier.tier;
            const isComplete = check.missing.length === 0 && hiscores;
            const tasksDone = getTaskCount(
              selectedRegion.name,
              tier.tier,
              tier.tasks.length
            );
            const allTasksDone = tasksDone === tier.tasks.length && tier.tasks.length > 0;

            return (
              <div key={tier.tier} className="bg-bg-secondary rounded-lg overflow-hidden">
                <button
                  onClick={() =>
                    setExpandedTier(isExpanded ? null : tier.tier)
                  }
                  className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-bg-tertiary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-medium ${TIER_COLORS[tier.tier]}`}
                    >
                      {tier.tier}
                    </span>
                    {isComplete && (
                      <span className="text-xs text-success">✓ Complete</span>
                    )}
                    {!isComplete && hiscores && (
                      <span className="text-xs text-text-secondary">
                        {check.met}/{check.total} requirements met
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {tier.tasks.length > 0 && (
                      <span
                        className={`text-[10px] tabular-nums ${
                          allTasksDone
                            ? "text-success"
                            : tasksDone > 0
                              ? "text-accent"
                              : "text-text-secondary/40"
                        }`}
                      >
                        {tasksDone}/{tier.tasks.length} tasks
                      </span>
                    )}
                    <span className="text-text-secondary text-xs">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-3 border-t border-border">
                    {/* Requirements */}
                    <div className="mt-3 mb-2">
                      <span className="text-xs text-text-secondary uppercase tracking-wider">
                        Requirements
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {tier.requirements.map((req) => {
                        const skill = hiscores?.skills.find(
                          (s) =>
                            s.name.toLowerCase() === req.skill.toLowerCase()
                        );
                        const current = skill?.level ?? 0;
                        const isMet = current >= req.level;

                        return (
                          <div
                            key={req.skill}
                            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded ${
                              isMet
                                ? "bg-success/10 text-success"
                                : "bg-danger/10 text-danger"
                            }`}
                          >
                            <img
                              src={SKILL_ICONS[req.skill]}
                              alt=""
                              className="w-3.5 h-3.5"
                            />
                            <span>{req.level}</span>
                            {hiscores && !isMet && (
                              <span className="text-text-secondary">
                                ({current})
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Tasks */}
                    {tier.tasks.length > 0 && (
                      <>
                        <div className="mb-1 mt-3">
                          <span className="text-xs text-text-secondary uppercase tracking-wider">
                            Tasks ({tasksDone}/{tier.tasks.length})
                          </span>
                        </div>
                        <ul className="text-xs space-y-1 mb-3">
                          {tier.tasks.map((task, j) => {
                            const key = taskKey(
                              selectedRegion.name,
                              tier.tier,
                              j
                            );
                            const isDone = completedTasks.has(key);
                            return (
                              <li key={j}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTask(key);
                                  }}
                                  className={`flex items-start gap-2 w-full text-left rounded px-1 py-0.5 transition-colors hover:bg-bg-tertiary ${
                                    isDone
                                      ? "text-success/60"
                                      : "text-text-secondary"
                                  }`}
                                >
                                  <span
                                    className={`mt-0.5 w-3.5 h-3.5 shrink-0 rounded border flex items-center justify-center text-[9px] ${
                                      isDone
                                        ? "border-success bg-success/20 text-success"
                                        : "border-border"
                                    }`}
                                  >
                                    {isDone && "✓"}
                                  </span>
                                  <span className={isDone ? "line-through" : ""}>
                                    {task}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </>
                    )}

                    {/* Rewards */}
                    <div className="mb-1">
                      <span className="text-xs text-text-secondary uppercase tracking-wider">
                        Rewards
                      </span>
                    </div>
                    <ul className="text-xs text-text-secondary space-y-0.5">
                      {tier.rewards.map((r, i) => (
                        <li key={i}>• {r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {!hiscores && (
        <p className="text-sm text-text-secondary mt-4">
          Look up your RSN to see which diary tiers you can complete.
        </p>
      )}
    </div>
  );
}
