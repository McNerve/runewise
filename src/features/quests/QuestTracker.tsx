import { useState, useMemo, useEffect } from "react";
import { QUESTS, QUEST_DIFFICULTIES, type Quest } from "../../lib/data/quests";
import { fetchAllQuests, type WikiQuest } from "../../lib/api/quests";
import { type HiscoreData } from "../../lib/api/hiscores";
import { SKILL_ICONS } from "../../lib/sprites";
import { formatGp } from "../../lib/format";
import ExternalLink from "../../components/ExternalLink";
import { useNavigation } from "../../lib/NavigationContext";
import { checkRequirements } from "./questRequirements";


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

// Canonical OSRS tier palette mapping for quest difficulties.
// Novice=gray, Intermediate=green, Experienced=yellow, Master=purple, Grandmaster=orange.
const DIFFICULTY_COLORS: Record<string, string> = {
  Novice: "text-text-secondary",
  Intermediate: "text-success",
  Experienced: "text-yellow-300",
  Master: "text-purple-400",
  Grandmaster: "text-orange-400",
  Special: "text-accent",
};

interface Props {
  hiscores: HiscoreData | null;
}

export default function QuestTracker({ hiscores }: Props) {
  const { params } = useNavigation();
  const [filter, setFilter] = useState<"all" | "available" | "locked">("all");
  const [diffFilter, setDiffFilter] = useState<string>("all");
  const [search, setSearch] = useState(params.quest ?? "");
  const [quests, setQuests] = useState<Quest[]>(QUESTS);
  const [wikiQuests, setWikiQuests] = useState<Map<string, WikiQuest>>(new Map());

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

    // Available/Locked filters only apply when hiscores are loaded
    if (hiscores) {
      if (filter === "available") result = result.filter((q) => q.status === "met");
      if (filter === "locked") result = result.filter((q) => q.status === "missing");
    }
    if (diffFilter !== "all")
      result = result.filter((q) => q.quest.difficulty === diffFilter);
    if (search.length >= 2) {
      const s = search.toLowerCase();
      result = result.filter((q) =>
        q.quest.name.toLowerCase().includes(s)
      );
    }

    return result;
  }, [questsWithStatus, filter, diffFilter, search, hiscores]);

  const available = questsWithStatus.filter((q) => q.status === "met").length;
  const total = questsWithStatus.length;
  // Derive the QP cap from the loaded quest list so the ratio can never exceed
  // 100% (the old hardcoded 300 was below the data's own ~333 total).
  const totalQp = useMemo(
    () => quests.reduce((sum, q) => sum + (q.questPoints ?? 0), 0),
    [quests]
  );

  // Quest Points from hiscores (activities array)
  const hiscoresQp = hiscores?.activities.find(
    (a) => a.name.toLowerCase().includes("quest")
  )?.score ?? null;


  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h2 className="text-xl font-semibold">Quest Tracker</h2>
        <div className="flex flex-col items-end gap-1 text-xs text-text-secondary">
          {hiscoresQp !== null && totalQp > 0 && (
            <span>{hiscoresQp} / {totalQp} QP</span>
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
          className="flex-1 px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-colors"
        />
        <div className="flex gap-1">
          {(["all", "available", "locked"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              disabled={!hiscores && f !== "all"}
              title={!hiscores && f !== "all" ? "Set your RSN to filter by requirements" : undefined}
              className={`px-2 py-1.5 rounded text-xs capitalize ${
                filter === f
                  ? f === "available"
                    ? "bg-success/20 text-success"
                    : f === "locked"
                      ? "bg-danger/20 text-danger"
                      : "bg-accent text-on-accent"
                  : "bg-bg-tertiary text-text-secondary"
              } ${!hiscores && f !== "all" ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setDiffFilter("all")}
          className={`px-2 py-0.5 rounded text-xs ${
            diffFilter === "all"
              ? "bg-accent text-on-accent"
              : "bg-bg-tertiary text-text-secondary"
          }`}
        >
          All
        </button>
        {QUEST_DIFFICULTIES.map((d) => {
          const tone = DIFFICULTY_COLORS[d] ?? "text-text-secondary";
          return (
            <button
              key={d}
              onClick={() => setDiffFilter(d)}
              aria-pressed={diffFilter === d}
              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                diffFilter === d
                  ? `bg-bg-secondary ${tone} ring-1 ring-border`
                  : "bg-bg-secondary/60 text-text-secondary/70 hover:text-text-primary"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Dot color legend */}
      <div className="flex items-center gap-4 mb-3 px-1 text-xs text-text-secondary/70">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-success" aria-hidden />
          Requirements met
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-danger" aria-hidden />
          Requirements missing
        </span>
        {!hiscores && (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-text-secondary/40" aria-hidden />
            Unknown (set RSN)
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {filtered.map(({ quest, status, missing }) => (
          <div key={quest.name} className="relative group">
          <ExternalLink
            href={`https://oldschool.runescape.wiki/w/${encodeURIComponent(quest.name.replace(/ /g, "_"))}`}
            className="block bg-bg-tertiary rounded-lg px-4 py-3 hover:bg-bg-secondary transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      status === "met"
                        ? "bg-success"
                        : status === "missing"
                          ? "bg-danger"
                          : "bg-text-secondary/40"
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
                  <span className={`text-xs font-medium ${DIFFICULTY_COLORS[quest.difficulty] ?? "text-text-secondary"}`}>
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
                {missing.map((m, mi) => (
                  <div
                    key={`${m.skill}-${m.required}-${mi}`}
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
                      {wiki.rewards.xp.map((r, ri) => (
                        <span
                          key={`${r.skill}-${r.amount}-${ri}`}
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
        ))}
      </div>

      {!hiscores && (
        <p className="text-sm text-text-secondary mt-4">
          Look up your RSN above to see which quests you can complete.
        </p>
      )}
    </div>
  );
}
