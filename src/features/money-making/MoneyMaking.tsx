import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { MONEY_METHODS, type MoneyMethod } from "../../lib/data/money-methods";
import { fetchAllMoneyMethods, type WikiMoneyMethod } from "../../lib/api/moneyMaking";
import { type HiscoreData } from "../../lib/api/hiscores";
import { formatGp } from "../../lib/format";
import { WIKI_IMG, SKILL_ICONS, NAV_ICONS } from "../../lib/sprites";
import { useNavigation } from "../../lib/NavigationContext";
import EmptyState from "../../components/EmptyState";
import { Tabs, FilterPills } from "../../components/primitives";

const ProfitRankings = lazy(() => import("./ProfitRankings"));

type MainTab = "methods" | "rankings" | "wiki";

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

function resolveMainTab(raw: string | undefined): MainTab {
  return raw === "rankings" || raw === "wiki" ? raw : "methods";
}

export default function MoneyMaking({ hiscores }: Props) {
  const { navigate, params } = useNavigation();
  const [category, setCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [membersOnly, setMembersOnly] = useState(true);
  const [bestForMe, setBestForMe] = useState(false);
  const [wikiMethods, setWikiMethods] = useState<WikiMoneyMethod[]>([]);
  const [mainTab, setMainTab] = useState<MainTab>(() => resolveMainTab(params.tab));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync tab from nav params
    setMainTab(resolveMainTab(params.tab));
  }, [params.tab]);

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

    // "Members only" unchecked = F2P only
    if (!membersOnly) {
      methods = methods.filter((m) => !m.members);
    }

    // Deduplicate by name (keep highest GP/hr)
    const seen = new Map<string, MoneyMethod>();
    for (const m of methods) {
      const key = m.name.toLowerCase();
      const existing = seen.get(key);
      if (!existing || m.baseGpPerHr > existing.baseGpPerHr) seen.set(key, m);
    }
    methods = [...seen.values()];

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
      <h2 className="text-hero font-semibold tracking-tight">Money Making</h2>
      <p className="text-sm text-text-secondary mb-4">
        {totalMethods} curated methods
        {availableCount !== null && ` — ${availableCount} available for your stats`}
      </p>

      {/* Main tabs */}
      <Tabs
        className="mb-4"
        activeId={mainTab}
        onChange={setMainTab}
        ariaLabel="Money making sections"
        items={[
          { id: "methods" as MainTab, label: "Methods", icon: `${WIKI_IMG}/Coins_detail.png` },
          { id: "rankings" as MainTab, label: "Profit Rankings", icon: `${WIKI_IMG}/Coins_10000.png` },
        ]}
      />

      {/* Alch Profits CTA — moved to Market (Items & Watchlist) */}
      {mainTab === "methods" && (
        <button
          onClick={() => navigate("market", { tab: "alch" })}
          className="w-full mb-4 flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-bg-secondary/60 hover:bg-bg-secondary border border-border/60 hover:border-accent/40 transition-colors text-left group"
        >
          <div className="flex items-center gap-3">
            <img src={`${WIKI_IMG}/High_Level_Alchemy.png`} alt="" className="w-4 h-4" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <div>
              <div className="text-sm font-medium">See alch profits in Items</div>
              <div className="text-[11px] text-text-secondary">Live alchemy calculator lives in Items &amp; Watchlist</div>
            </div>
          </div>
          <span className="text-accent group-hover:translate-x-0.5 transition-transform">→</span>
        </button>
      )}

      {/* Filters — only for Methods tab */}
      {mainTab === "methods" && (
      <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search methods..."
          aria-label="Search money making methods"
          className="flex-1 min-w-[200px] bg-bg-tertiary border border-border rounded px-3 py-1.5 text-sm"
        />

        <FilterPills
          ariaLabel="Method category"
          activeKey={category}
          onChange={setCategory}
          items={CATEGORIES.map((c) => ({ id: c, label: c }))}
        />
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
      </>
      )}

      {/* Methods list */}
      {mainTab === "methods" && (
      <div className="space-y-1.5">
        {filtered.map((method) => {
          const canDo = hiscores ? meetsRequirements(method, hiscores) : true;
          const missing = hiscores && !canDo ? getMissingSkills(method, hiscores) : [];

          return (
            <div
              key={method.name}
              className={`bg-bg-tertiary rounded-lg px-4 py-3 transition-colors ${
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
                  {method.category === "Combat" && (
                    <button
                      type="button"
                      onClick={() => navigate("bosses", { boss: method.name })}
                      className="text-[10px] text-text-secondary/40 hover:text-accent transition-colors"
                    >
                      Open guide
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {mainTab === "methods" && filtered.length === 0 && (
        <EmptyState
          icon={NAV_ICONS["money-making"]}
          title="No methods match your filters"
          description="Try adjusting your search or category."
        />
      )}

      {mainTab === "rankings" && (
        <Suspense fallback={<div className="py-8"><div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-3/4 mx-auto" /></div>}>
          <ProfitRankings />
        </Suspense>
      )}

      {mainTab === "wiki" && (
        <div className="space-y-2 mt-2">
          {(() => {
            let methods = [...wikiMethods];
            if (category !== "All") {
              methods = methods.filter((m) => m.category === category);
            }
            if (!membersOnly) {
              methods = methods.filter((m) => !m.members);
            }
            // Deduplicate wiki methods by activity name
            const wikiSeen = new Set<string>();
            methods = methods.filter((m) => {
              const key = m.activity.toLowerCase();
              if (wikiSeen.has(key)) return false;
              wikiSeen.add(key);
              return true;
            });
            if (search.length >= 2) {
              const s = search.toLowerCase();
              methods = methods.filter((m) => m.activity.toLowerCase().includes(s));
            }
            methods.sort((a, b) => b.profitPerHour - a.profitPerHour);
            return methods.slice(0, 100);
          })().map((method) => (
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

      {mainTab === "methods" && !hiscores && (
        <p className="text-sm text-text-secondary mt-4">
          Look up your RSN above to see which methods you can do and enable "Best for me" filtering.
        </p>
      )}
    </div>
  );
}
