import { useState, useMemo, useEffect } from "react";
import { MONEY_METHODS, type MoneyMethod } from "../../lib/data/money-methods";
import { fetchAllMoneyMethods, type WikiMoneyMethod } from "../../lib/api/moneyMaking";
import { type HiscoreData } from "../../lib/api/hiscores";
import { formatGp } from "../../lib/format";
import { SKILL_ICONS, NAV_ICONS } from "../../lib/sprites";
import EmptyState from "../../components/EmptyState";

interface Props {
  hiscores: HiscoreData | null;
}

type Category = "All" | MoneyMethod["category"];

const CATEGORIES: Category[] = ["All", "Combat", "Skilling", "Processing", "Collecting"];

const CATEGORY_COLORS: Record<MoneyMethod["category"], string> = {
  Combat: "bg-danger/20 text-danger",
  Skilling: "bg-success/20 text-success",
  Processing: "bg-accent/20 text-accent",
  Collecting: "bg-warning/20 text-warning",
};

function meetsRequirements(method: MoneyMethod, hiscores: HiscoreData): boolean {
  return method.skills.every((req) => {
    const skill = hiscores.skills.find(
      (s) => s.name.toLowerCase() === req.name.toLowerCase()
    );
    return (skill?.level ?? 1) >= req.level;
  });
}

function getMissingSkills(
  method: MoneyMethod,
  hiscores: HiscoreData
): { name: string; required: number; current: number }[] {
  const missing: { name: string; required: number; current: number }[] = [];
  for (const req of method.skills) {
    const skill = hiscores.skills.find(
      (s) => s.name.toLowerCase() === req.name.toLowerCase()
    );
    const current = skill?.level ?? 1;
    if (current < req.level) {
      missing.push({ name: req.name, required: req.level, current });
    }
  }
  return missing;
}

export default function MoneyMaking({ hiscores }: Props) {
  const [category, setCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [membersOnly, setMembersOnly] = useState(true);
  const [bestForMe, setBestForMe] = useState(false);
  const [wikiMethods, setWikiMethods] = useState<WikiMoneyMethod[]>([]);
  const [showWiki, setShowWiki] = useState(false);

  useEffect(() => {
    fetchAllMoneyMethods().then((methods) => {
      if (methods.length > 0) setWikiMethods(methods);
    });
  }, []);

  const filtered = useMemo(() => {
    let methods = [...MONEY_METHODS];

    if (category !== "All") {
      methods = methods.filter((m) => m.category === category);
    }

    if (!membersOnly) {
      methods = methods.filter((m) => !m.members);
    }

    if (bestForMe && hiscores) {
      methods = methods.filter((m) => meetsRequirements(m, hiscores));
    }

    if (search.length >= 2) {
      const s = search.toLowerCase();
      methods = methods.filter(
        (m) =>
          m.name.toLowerCase().includes(s) ||
          m.description.toLowerCase().includes(s)
      );
    }

    methods.sort((a, b) => b.baseGpPerHr - a.baseGpPerHr);

    return methods;
  }, [category, search, membersOnly, bestForMe, hiscores]);

  const totalMethods = MONEY_METHODS.length;
  const availableCount = useMemo(
    () => hiscores ? MONEY_METHODS.filter((m) => meetsRequirements(m, hiscores)).length : null,
    [hiscores]
  );

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-semibold">Money Making Guide</h2>
        {wikiMethods.length > 0 && (
          <button
            onClick={() => setShowWiki(!showWiki)}
            className={`text-xs transition-colors ${showWiki ? "text-accent" : "text-text-secondary/50 hover:text-text-primary"}`}
          >
            {showWiki ? `Wiki Methods (${wikiMethods.length})` : `Show Wiki (${wikiMethods.length})`}
          </button>
        )}
      </div>
      <p className="text-xs text-text-secondary mb-4">
        {showWiki ? wikiMethods.length : totalMethods} methods
        {!showWiki && availableCount !== null && ` — ${availableCount} available for your stats`}
      </p>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search methods..."
          className="flex-1 min-w-[200px] bg-bg-secondary border border-border rounded px-3 py-1.5 text-sm"
        />

        <div className="flex gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-2.5 py-1.5 rounded text-xs transition-colors ${
                category === c
                  ? "bg-accent text-white"
                  : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={membersOnly}
            onChange={(e) => setMembersOnly(e.target.checked)}
            className="rounded"
          />
          Members only
        </label>

        {hiscores && (
          <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={bestForMe}
              onChange={(e) => setBestForMe(e.target.checked)}
              className="rounded"
            />
            Best for me
          </label>
        )}
      </div>

      {/* Methods list */}
      <div className="space-y-1.5">
        {filtered.map((method) => {
          const canDo = hiscores ? meetsRequirements(method, hiscores) : true;
          const missing = hiscores && !canDo ? getMissingSkills(method, hiscores) : [];

          return (
            <div
              key={method.name}
              className={`bg-bg-secondary rounded-lg px-4 py-3 transition-colors ${
                canDo ? "" : "opacity-50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{method.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${CATEGORY_COLORS[method.category]}`}
                    >
                      {method.category}
                    </span>
                    {!method.members && (
                      <span className="text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded">
                        F2P
                      </span>
                    )}
                    {method.intensity && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        method.intensity === "afk" ? "bg-success/10 text-success" :
                        method.intensity === "low" ? "bg-accent/10 text-accent" :
                        method.intensity === "medium" ? "bg-warning/10 text-warning" :
                        "bg-danger/10 text-danger"
                      }`}>
                        {method.intensity.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    {method.description}
                  </p>

                  {/* Skill requirements */}
                  {method.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {method.skills.map((skill) => {
                        const playerSkill = hiscores?.skills.find(
                          (s) => s.name.toLowerCase() === skill.name.toLowerCase()
                        );
                        const current = playerSkill?.level ?? 0;
                        const isMet = !hiscores || current >= skill.level;

                        return (
                          <div
                            key={skill.name}
                            className={`flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded ${
                              isMet
                                ? "bg-bg-tertiary text-text-secondary"
                                : "bg-danger/10 text-danger"
                            }`}
                          >
                            <img
                              src={SKILL_ICONS[skill.name]}
                              alt=""
                              className="w-3 h-3"
                            />
                            <span>{skill.level}</span>
                            {hiscores && !isMet && (
                              <span className="text-text-secondary/60">
                                ({current})
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Missing skills summary */}
                  {missing.length > 0 && (
                    <p className="text-[10px] text-danger/70 mt-1">
                      Need:{" "}
                      {missing
                        .map((m) => `${m.name} ${m.current}→${m.required}`)
                        .join(", ")}
                    </p>
                  )}
                </div>

                {/* GP/hr */}
                <div className="text-right shrink-0">
                  <span className="text-sm font-semibold text-warning">
                    {formatGp(method.baseGpPerHr)}
                  </span>
                  <span className="text-[10px] text-text-secondary block">
                    GP/hr
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!showWiki && filtered.length === 0 && (
        <EmptyState
          icon={NAV_ICONS["money-making"]}
          title="No methods match your filters"
          description="Try adjusting your search or category."
        />
      )}

      {showWiki && (
        <div className="space-y-2 mt-2">
          {wikiMethods
            .filter((m) => !search || m.activity.toLowerCase().includes(search.toLowerCase()))
            .slice(0, 100)
            .map((method) => (
              <div
                key={method.name}
                className="py-3 px-3 rounded-lg hover:bg-bg-secondary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{method.activity}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-secondary">
                        {method.category}
                      </span>
                      {method.intensity !== "Unknown" && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          method.intensity === "Low" ? "bg-success/10 text-success" :
                          method.intensity === "Medium" ? "bg-warning/10 text-warning" :
                          "bg-danger/10 text-danger"
                        }`}>
                          {method.intensity.toUpperCase()}
                        </span>
                      )}
                    </div>
                    {method.skillRequirements && (
                      <p className="text-xs text-text-secondary/60 mt-0.5 truncate">
                        {method.skillRequirements}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-success tabular-nums">
                      {formatGp(method.profitPerHour)}
                    </div>
                    <div className="text-[10px] text-text-secondary">GP/hr</div>
                  </div>
                </div>
              </div>
            ))}
          <p className="text-xs text-text-secondary/40 mt-2 text-right">
            Data from OSRS Wiki money making guides
          </p>
        </div>
      )}

      {!showWiki && !hiscores && (
        <p className="text-sm text-text-secondary mt-4">
          Look up your RSN above to see which methods you can do and enable "Best for me" filtering.
        </p>
      )}
    </div>
  );
}
