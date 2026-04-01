import { useState, useMemo } from "react";
import { QUESTS, QUEST_DIFFICULTIES, type Quest } from "../../lib/data/quests";
import { type HiscoreData } from "../../lib/api/hiscores";
import { SKILL_ICONS } from "../../lib/sprites";
import ExternalLink from "../../components/ExternalLink";

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
  const [filter, setFilter] = useState<"all" | "available" | "locked">("all");
  const [diffFilter, setDiffFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const questsWithStatus = useMemo(() => {
    return QUESTS.map((quest) => ({
      quest,
      ...checkRequirements(quest, hiscores),
    }));
  }, [hiscores]);

  const filtered = useMemo(() => {
    let result = questsWithStatus;

    if (filter === "available") result = result.filter((q) => q.met);
    if (filter === "locked") result = result.filter((q) => !q.met);
    if (diffFilter !== "all")
      result = result.filter((q) => q.quest.difficulty === diffFilter);
    if (search.length >= 2) {
      const s = search.toLowerCase();
      result = result.filter((q) =>
        q.quest.name.toLowerCase().includes(s)
      );
    }

    return result;
  }, [questsWithStatus, filter, diffFilter, search]);

  const available = questsWithStatus.filter((q) => q.met).length;
  const total = questsWithStatus.length;

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-1">Quest Tracker</h2>
      {hiscores && (
        <p className="text-xs text-text-secondary mb-4">
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
        {filtered.map(({ quest, met, missing }) => (
          <ExternalLink
            key={quest.name}
            href={`https://oldschool.runescape.wiki/w/${encodeURIComponent(quest.name.replace(/ /g, "_"))}`}
            className="block bg-bg-secondary rounded-lg px-4 py-3 hover:bg-bg-tertiary transition-colors cursor-pointer"
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
          </ExternalLink>
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
