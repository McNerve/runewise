import { useState, useMemo, useEffect } from "react";
import type { HiscoreData } from "../../../lib/api/hiscores";
import { QUESTS, type Quest } from "../../../lib/data/quests";
import { fetchAllQuests, type WikiQuest } from "../../../lib/api/quests";
import {
  checkAllQuests,
  type QuestEligibility,
  type EligibilityStatus,
} from "../../../lib/formulas/questEligibility";
import { SKILL_ICONS } from "../../../lib/sprites";

function wikiToQuest(w: WikiQuest): Quest {
  return {
    name: w.name,
    difficulty: w.difficulty,
    length: w.length,
    questPoints: w.questPoints,
    members: w.members,
    skillRequirements: w.skillRequirements,
    questRequirements: w.questRequirements,
  };
}

interface Props {
  hiscores: HiscoreData;
}

const STATUS_CONFIG: Record<
  EligibilityStatus,
  { label: string; color: string; bg: string }
> = {
  ready: { label: "Ready", color: "text-success", bg: "bg-success/10" },
  almost: { label: "Almost", color: "text-warning", bg: "bg-warning/10" },
  locked: { label: "Locked", color: "text-danger", bg: "bg-danger/10" },
};

type FilterStatus = "all" | EligibilityStatus;
type SortKey = "name" | "questPoints" | "gap";

export default function QuestUnlock({ hiscores }: Props) {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("gap");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [quests, setQuests] = useState<Quest[]>(QUESTS);

  useEffect(() => {
    fetchAllQuests().then((wikiQuests) => {
      if (wikiQuests.length > 0) {
        setQuests(wikiQuests.map(wikiToQuest));
      }
    });
  }, []);

  const eligibility = useMemo(
    () => checkAllQuests(quests, hiscores),
    [hiscores, quests]
  );

  const counts = useMemo(() => {
    const c = { ready: 0, almost: 0, locked: 0 };
    for (const e of eligibility) c[e.status]++;
    return c;
  }, [eligibility]);

  const filtered = useMemo(() => {
    let list = filter === "all" ? eligibility : eligibility.filter((e) => e.status === filter);

    list = [...list].sort((a, b) => {
      if (sortKey === "name") return a.quest.name.localeCompare(b.quest.name);
      if (sortKey === "questPoints") return b.quest.questPoints - a.quest.questPoints;
      // gap: ready first, then almost (low gap), then locked (high gap)
      const statusOrder: Record<EligibilityStatus, number> = { ready: 0, almost: 1, locked: 2 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return a.maxGap - b.maxGap;
    });

    return list;
  }, [eligibility, filter, sortKey]);

  return (
    <div>
      {/* Summary pills */}
      <div className="flex gap-2 mb-4">
        {(["all", "ready", "almost", "locked"] as const).map((s) => {
          const count = s === "all" ? eligibility.length : counts[s];
          const config = s === "all" ? null : STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded text-xs transition-colors ${
                filter === s
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "bg-bg-secondary text-text-secondary border border-transparent hover:border-border"
              }`}
            >
              {s === "all" ? "All" : config?.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Sort */}
      <div className="flex gap-2 mb-4">
        <span className="text-xs text-text-secondary/50">Sort:</span>
        {([
          { key: "gap" as const, label: "Accessibility" },
          { key: "questPoints" as const, label: "Quest Points" },
          { key: "name" as const, label: "Name" },
        ]).map((s) => (
          <button
            key={s.key}
            onClick={() => setSortKey(s.key)}
            className={`text-xs transition-colors ${
              sortKey === s.key ? "text-accent" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Quest list */}
      <div className="space-y-1">
        {filtered.map((e) => (
          <QuestRow
            key={e.quest.name}
            eligibility={e}
            expanded={expanded === e.quest.name}
            onToggle={() =>
              setExpanded(expanded === e.quest.name ? null : e.quest.name)
            }
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-text-secondary">
          No quests match this filter.
        </div>
      )}
    </div>
  );
}

function QuestRow({
  eligibility: e,
  expanded,
  onToggle,
}: {
  eligibility: QuestEligibility;
  expanded: boolean;
  onToggle: () => void;
}) {
  const config = STATUS_CONFIG[e.status];

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full text-left flex items-center gap-3 py-2 px-2 rounded hover:bg-bg-secondary/50 transition-colors"
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          e.status === "ready" ? "bg-success" :
          e.status === "almost" ? "bg-warning" : "bg-danger/50"
        }`} />
        <span className="text-sm flex-1 truncate">{e.quest.name}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
          {config.label}
        </span>
        <span className="text-xs text-text-secondary/50 tabular-nums w-8 text-right">
          {e.quest.questPoints} QP
        </span>
        <span className="text-xs text-text-secondary/40">
          {e.quest.difficulty}
        </span>
      </button>

      {expanded && e.unmetSkills.length > 0 && (
        <div className="ml-6 mb-2 flex flex-wrap gap-1.5">
          {e.unmetSkills.map((u) => (
            <div
              key={u.skill}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-bg-tertiary text-xs"
            >
              <img
                src={SKILL_ICONS[u.skill]}
                alt=""
                className="w-3.5 h-3.5"
                onError={(ev) => { ev.currentTarget.style.display = "none"; }}
              />
              <span className="text-danger tabular-nums">{u.current}</span>
              <span className="text-text-secondary/40">→</span>
              <span className="text-text-primary tabular-nums">{u.required}</span>
            </div>
          ))}
        </div>
      )}

      {expanded && e.unmetSkills.length === 0 && e.quest.skillRequirements.length > 0 && (
        <div className="ml-6 mb-2 flex flex-wrap gap-1.5">
          {e.quest.skillRequirements.map((r) => (
            <div
              key={r.skill}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-success/10 text-xs"
            >
              <img
                src={SKILL_ICONS[r.skill]}
                alt=""
                className="w-3.5 h-3.5"
                onError={(ev) => { ev.currentTarget.style.display = "none"; }}
              />
              <span className="text-success tabular-nums">{r.level}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
