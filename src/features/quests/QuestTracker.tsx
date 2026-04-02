import { useState, useMemo, useEffect } from "react";
import { QUESTS, QUEST_DIFFICULTIES, type Quest } from "../../lib/data/quests";
import { fetchAllQuests, type WikiQuest } from "../../lib/api/quests";
import { type HiscoreData } from "../../lib/api/hiscores";
import { SKILL_ICONS } from "../../lib/sprites";
import { formatGp } from "../../lib/format";
import { loadJSON, saveJSON } from "../../lib/localStorage";
import ExternalLink from "../../components/ExternalLink";
import { useNavigation } from "../../lib/NavigationContext";

const COMPLETED_QUESTS_KEY = "runewise_completed_quests";

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
  hiscores: HiscoreData | null;
}

function checkRequirements(
  quest: Quest,
  hiscores: HiscoreData | null
): { met: boolean; missing: { skill: string; required: number; current: number }[] } {
  if (!hiscores || quest.skillRequirements.length === 0) {
    return { met: true, missing: [] };
  }

  const missing: { skill: string; required: number; current: number }[] = [];
  for (const req of quest.skillRequirements) {
    const skill = hiscores.skills.find(
      (s) => s.name.toLowerCase() === req.skill.toLowerCase()
    );
    const current = skill?.level ?? 1;
    if (current < req.level) {
      missing.push({ skill: req.skill, required: req.level, current });
    }
  }

  return { met: missing.length === 0, missing };
}

export default function QuestTracker({ hiscores }: Props) {
  const { params } = useNavigation();
  const [filter, setFilter] = useState<"all" | "available" | "locked">("all");
  const [diffFilter, setDiffFilter] = useState<string>("all");
  const [search, setSearch] = useState(params.quest ?? "");
  const [quests, setQuests] = useState<Quest[]>(QUESTS);
  const [wikiQuests, setWikiQuests] = useState<Map<string, WikiQuest>>(new Map());
  const [completedQuests, setCompletedQuests] = useState<Set<string>>(
    () => new Set(loadJSON<string[]>(COMPLETED_QUESTS_KEY, []))
  );
  const [hideCompleted, setHideCompleted] = useState(false);

  useEffect(() => {
    fetchAllQuests().then((fetched) => {
      if (fetched.length > 0) {
        setQuests(fetched.map(wikiToQuest));
        setWikiQuests(new Map(fetched.map((w) => [w.name, w])));
      }
    });
  }, []);

  const questsWithStatus = useMemo(() => {
    return quests.map((quest) => ({
      quest,
      ...checkRequirements(quest, hiscores),
    }));
  }, [hiscores, quests]);

  const filtered = useMemo(() => {
    let result = questsWithStatus;

    if (filter === "available") result = result.filter((q) => q.met);
    if (filter === "locked") result = result.filter((q) => !q.met);
    if (hideCompleted) result = result.filter((q) => !completedQuests.has(q.quest.name));
    if (diffFilter !== "all")
      result = result.filter((q) => q.quest.difficulty === diffFilter);
    if (search.length >= 2) {
      const s = search.toLowerCase();
      result = result.filter((q) =>
        q.quest.name.toLowerCase().includes(s)
      );
    }

    return result;
  }, [questsWithStatus, filter, diffFilter, search, hideCompleted, completedQuests]);

  const available = questsWithStatus.filter((q) => q.met).length;
  const total = questsWithStatus.length;

  // Quest Points from hiscores (activities array)
  const hiscoresQp = hiscores?.activities.find(
    (a) => a.name.toLowerCase().includes("quest")
  )?.score ?? null;

  const completedCount = completedQuests.size;

  function toggleCompleted(questName: string) {
    setCompletedQuests((prev) => {
      const next = new Set(prev);
      if (next.has(questName)) {
        next.delete(questName);
      } else {
        next.add(questName);
      }
      saveJSON(COMPLETED_QUESTS_KEY, [...next]);
      return next;
    });
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h2 className="text-xl font-semibold">Quest Tracker</h2>
        <div className="flex flex-col items-end gap-1 text-xs text-text-secondary">
          {hiscoresQp !== null && (
            <span>{hiscoresQp} / 300 QP</span>
          )}
          {completedCount > 0 && (
            <span>{completedCount} / {total} marked complete</span>
          )}
        </div>
      </div>
      {hiscores && (
        <p className="text-xs text-text-secondary mb-2">
          {available}/{total} quests available based on your stats
        </p>
      )}

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search quests..."
          className="flex-1 bg-bg-secondary border border-border rounded px-3 py-1.5 text-sm"
        />
        <div className="flex gap-1">
          {(["all", "available", "locked"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1.5 rounded text-xs capitalize ${
                filter === f
                  ? f === "available"
                    ? "bg-success/20 text-success"
                    : f === "locked"
                      ? "bg-danger/20 text-danger"
                      : "bg-accent text-white"
                  : "bg-bg-secondary text-text-secondary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-text-secondary select-none">
          <input
            type="checkbox"
            checked={hideCompleted}
            onChange={(e) => setHideCompleted(e.target.checked)}
            className="w-3.5 h-3.5 accent-accent"
          />
          Hide completed
        </label>
      </div>

      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setDiffFilter("all")}
          className={`px-2 py-0.5 rounded text-xs ${
            diffFilter === "all"
              ? "bg-accent text-white"
              : "bg-bg-secondary text-text-secondary"
          }`}
        >
          All
        </button>
        {QUEST_DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() => setDiffFilter(d)}
            className={`px-2 py-0.5 rounded text-xs ${
              diffFilter === d
                ? "bg-accent text-white"
                : "bg-bg-secondary text-text-secondary"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        {filtered.map(({ quest, met, missing }) => {
          const isCompleted = completedQuests.has(quest.name);
          return (
          <div key={quest.name} className="relative group">
          <button
            onClick={(e) => { e.stopPropagation(); toggleCompleted(quest.name); }}
            title={isCompleted ? "Mark incomplete" : "Mark complete"}
            className={`absolute left-1 top-1/2 -translate-y-1/2 z-10 w-5 h-5 flex items-center justify-center rounded text-[10px] transition-colors ${
              isCompleted
                ? "bg-success/20 text-success"
                : "opacity-0 group-hover:opacity-100 bg-bg-tertiary text-text-secondary/40 hover:text-text-secondary"
            }`}
          >
            {isCompleted ? "✓" : "○"}
          </button>
          <ExternalLink
            href={`https://oldschool.runescape.wiki/w/${encodeURIComponent(quest.name.replace(/ /g, "_"))}`}
            className={`block bg-bg-secondary rounded-lg pl-8 pr-4 py-3 hover:bg-bg-tertiary transition-colors cursor-pointer ${isCompleted ? "opacity-60" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      met ? "bg-success" : "bg-danger"
                    }`}
                  />
                  <span className="text-sm font-medium">{quest.name}</span>
                  {!quest.members && (
                    <span className="text-[10px] bg-success/20 text-success px-1 rounded">
                      F2P
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 ml-4">
                  <span className="text-xs text-text-secondary">
                    {quest.difficulty}
                  </span>
                  <span className="text-xs text-text-secondary">·</span>
                  <span className="text-xs text-text-secondary">
                    {quest.length}
                  </span>
                  <span className="text-xs text-text-secondary">·</span>
                  <span className="text-xs text-text-secondary">
                    {quest.questPoints} QP
                  </span>
                </div>
              </div>
            </div>

            {missing.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 ml-4">
                {missing.map((m) => (
                  <div
                    key={m.skill}
                    className="flex items-center gap-1 bg-danger/10 text-danger text-xs px-2 py-0.5 rounded"
                  >
                    <img
                      src={SKILL_ICONS[m.skill]}
                      alt=""
                      className="w-3 h-3"
                    />
                    {m.skill} {m.current}/{m.required}
                  </div>
                ))}
              </div>
            )}

            {quest.questRequirements.length > 0 && (
              <div className="mt-1.5 ml-4">
                <span className="text-[10px] text-text-secondary">
                  Requires: {quest.questRequirements.join(", ")}
                </span>
              </div>
            )}

            {(() => {
              const wiki = wikiQuests.get(quest.name);
              if (!wiki) return null;
              const details: { label: string; value: string }[] = [];
              if (wiki.startPoint) details.push({ label: "Start", value: wiki.startPoint });
              if (wiki.itemsRequired) details.push({ label: "Items", value: wiki.itemsRequired });
              if (wiki.enemiesToDefeat && wiki.enemiesToDefeat !== "None") details.push({ label: "Enemies", value: wiki.enemiesToDefeat });
              if (wiki.ironmanConcerns && wiki.ironmanConcerns !== "None") details.push({ label: "Ironman", value: wiki.ironmanConcerns });

              const hasRewards =
                wiki.rewards.xp.length > 0 ||
                wiki.rewards.items.length > 0 ||
                wiki.rewards.other.length > 0;

              if (details.length === 0 && !hasRewards) return null;
              return (
                <div className="mt-1.5 ml-4 space-y-0.5">
                  {details.map((d) => (
                    <div key={d.label} className="text-xs text-text-secondary">
                      <span className="font-medium">{d.label}:</span> {d.value}
                    </div>
                  ))}
                  {hasRewards && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {wiki.rewards.xp.map((r) => (
                        <span
                          key={r.skill}
                          className="flex items-center gap-1 bg-accent/10 text-accent text-[10px] px-1.5 py-0.5 rounded"
                        >
                          {SKILL_ICONS[r.skill] && (
                            <img src={SKILL_ICONS[r.skill]} alt="" className="w-3 h-3" />
                          )}
                          {formatGp(r.amount)} XP
                        </span>
                      ))}
                      {wiki.rewards.other.map((r, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </ExternalLink>
          </div>
          );
        })}
      </div>

      {!hiscores && (
        <p className="text-sm text-text-secondary mt-4">
          Look up your RSN above to see which quests you can complete.
        </p>
      )}
    </div>
  );
}
