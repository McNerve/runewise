import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { itemIcon, NAV_ICONS } from "../../lib/sprites";
import {
  fetchTempleCollectionLog,
  fetchTemplePlayerInfo,
  fetchTempleClogItemNames,
  fetchTempleClogSchema,
  type TempleCollectionLog,
  type TempleClogSchema,
} from "../../lib/api/temple";
import { clearCacheKey } from "../../lib/api/cache";
import { useNavigation } from "../../lib/NavigationContext";
import FreshnessStrip from "../../components/FreshnessStrip";

function ProgressRing({
  obtained,
  total,
  size = 36,
}: {
  obtained: number;
  total: number;
  size?: number;
}) {
  const pct = total > 0 ? obtained / total : 0;
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-bg-tertiary)"
        strokeWidth={3}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={pct >= 1 ? "var(--color-success)" : "var(--color-accent)"}
        strokeWidth={3}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-300"
      />
    </svg>
  );
}


// Temple title-cases names ("Smashed Mirror") but wiki uses game casing ("Smashed_mirror.png").
// Build a fallback chain: GE-mapping icon (primary) → wiki-cased name → fully-lowercased name.
function itemIconCandidates(name: string): string[] {
  const primary = itemIcon(name);
  const wikiCased = itemIcon(name.charAt(0).toUpperCase() + name.slice(1).toLowerCase());
  const lowered = itemIcon(name.toLowerCase());
  return Array.from(new Set([primary, wikiCased, lowered]));
}

function ClogItemImage({ name, className }: { name: string; className?: string }) {
  const candidates = itemIconCandidates(name);
  return (
    <img
      src={candidates[0]}
      alt={name}
      data-attempt="0"
      className={className}
      onError={(e) => {
        const el = e.currentTarget;
        const next = Number(el.dataset.attempt ?? "0") + 1;
        if (next < candidates.length) {
          el.dataset.attempt = String(next);
          el.src = candidates[next]!;
        } else {
          el.style.display = "none";
          const sibling = el.nextElementSibling;
          if (sibling instanceof HTMLElement) sibling.style.display = "flex";
        }
      }}
    />
  );
}

type ItemFilter = "all" | "obtained" | "missing";

function TempleView({ data }: { data: TempleCollectionLog }) {
  const { navigate } = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [itemFilter, setItemFilter] = useState<ItemFilter>("all");
  const [activeTab, setActiveTab] = useState<string>("bosses");
  const [itemNames, setItemNames] = useState<Map<number, string>>(new Map());
  const [schema, setSchema] = useState<TempleClogSchema | null>(null);
  const itemsPanelRef = useRef<HTMLDivElement>(null);

  // Build a set of obtained item IDs with counts from player data
  const obtainedMap = useMemo(() => {
    const map = new Map<number, { count: number; date?: string }>();
    for (const items of Object.values(data.categories)) {
      for (const item of items) {
        if (item.count > 0) {
          map.set(item.id, { count: item.count, date: item.obtained_at });
        }
      }
    }
    return map;
  }, [data.categories]);

  useEffect(() => {
    Promise.all([fetchTempleClogItemNames(), fetchTempleClogSchema()])
      .then(([names, s]) => {
        setItemNames(names);
        setSchema(s);
      })
      .catch((err) => {
        console.error("[RuneWise] Collection log data fetch failed:", err);
      });
  }, []);

  const resolveName = useCallback(
    (item: { id: number; name?: string }) =>
      item.name ?? itemNames.get(item.id) ?? `Item ${item.id}`,
    [itemNames]
  );

  // Schema-based categories: shows ALL items, not just obtained
  const schemaCategories = useMemo(() => {
    if (!schema) return [];
    const tabCats = schema.tabs[activeTab] ?? {};
    return Object.entries(tabCats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([slug, itemIds]) => {
        const catName = slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        const obtained = itemIds.filter((id) => obtainedMap.has(id)).length;
        return { slug, catName, itemIds, obtained, total: itemIds.length };
      });
  }, [schema, activeTab, obtainedMap]);

  const tabStats = useMemo(() => {
    if (!schema) return {};
    const stats: Record<string, { obtained: number; total: number }> = {};
    for (const [tab, cats] of Object.entries(schema.tabs)) {
      const allIds = Object.values(cats).flat();
      stats[tab] = {
        obtained: allIds.filter((id) => obtainedMap.has(id)).length,
        total: allIds.length,
      };
    }
    return stats;
  }, [schema, obtainedMap]);

  const completedCats = useMemo(() => {
    if (!schema) return 0;
    let count = 0;
    for (const cats of Object.values(schema.tabs)) {
      for (const itemIds of Object.values(cats)) {
        if (itemIds.length > 0 && itemIds.every((id) => obtainedMap.has(id))) count++;
      }
    }
    return count;
  }, [schema, obtainedMap]);

  const totalCats = useMemo(() => {
    if (!schema) return 0;
    return Object.values(schema.tabs).reduce((s, cats) => s + Object.keys(cats).length, 0);
  }, [schema]);

  // Recent items — last 6 obtained sorted by date
  const recentItems = useMemo(() => {
    const all: { id: number; name?: string; count: number; obtained_at?: string; category: string }[] = [];
    for (const [catName, items] of Object.entries(data.categories)) {
      for (const item of items) {
        if (item.count > 0 && item.obtained_at) {
          all.push({ ...item, category: catName });
        }
      }
    }
    return all
      .sort((a, b) => (b.obtained_at ?? "").localeCompare(a.obtained_at ?? ""))
      .slice(0, 8);
  }, [data.categories]);

  // Selected category — full items from schema
  const activeSchemaCat = useMemo(
    () => schemaCategories.find((c) => c.slug === selectedCategory) ?? null,
    [schemaCategories, selectedCategory]
  );

  const activeCatItems = useMemo(() => {
    if (!activeSchemaCat) return [];
    let items = activeSchemaCat.itemIds.map((id) => {
      const obtained = obtainedMap.get(id);
      return {
        id,
        name: itemNames.get(id) ?? `Item ${id}`,
        count: obtained?.count ?? 0,
        obtained_at: obtained?.date,
      };
    });
    if (itemFilter === "obtained") items = items.filter((i) => i.count > 0);
    if (itemFilter === "missing") items = items.filter((i) => i.count === 0);
    return items;
  }, [activeSchemaCat, obtainedMap, itemNames, itemFilter]);

  return (
    <>
      {/* ── Summary stats ── */}
      <div className="grid grid-cols-3 gap-px rounded-xl overflow-hidden border border-border/40 mb-6">
        <div className="bg-bg-secondary/50 px-5 py-4 flex items-center gap-3">
          <img src={NAV_ICONS["collection-log"]} alt="" className="w-8 h-8 shrink-0 opacity-60" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-text-secondary/50">Collections</div>
            <div className="text-lg font-bold tabular-nums">{data.finished} / {data.total}</div>
            <div className="text-[10px] text-text-secondary/40">{((data.finished / data.total) * 100).toFixed(1)}%</div>
          </div>
        </div>
        <div className="bg-bg-secondary/50 px-5 py-4 flex items-center gap-3">
          <ProgressRing obtained={completedCats} total={totalCats} size={32} />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-text-secondary/50">Categories</div>
            <div className="text-lg font-bold tabular-nums">{completedCats} / {totalCats}</div>
            <div className="text-[10px] text-text-secondary/40">completed</div>
          </div>
        </div>
        <div className="bg-bg-secondary/50 px-5 py-4 flex items-center gap-3 justify-center">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider text-text-secondary/50">Source</div>
            <div className="text-sm font-medium mt-1 text-accent">TempleOSRS</div>
            <div className="text-[10px] text-text-secondary/40">live sync</div>
          </div>
        </div>
      </div>

      {/* ── Recent items ── */}
      {recentItems.length > 0 && (
        <div className="mb-6">
          <div className="text-[10px] uppercase tracking-wider text-text-secondary/50 mb-2">Recently Obtained</div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {recentItems.map((item) => {
              // Prefer schema-resolved name (matches what works in the category grid)
              const name = itemNames.get(item.id) ?? resolveName(item);
              const date = item.obtained_at ? new Date(item.obtained_at + " UTC") : null;
              return (
                <div
                  key={`recent-${item.id}-${item.obtained_at}`}
                  className="flex flex-col items-center gap-1.5 min-w-[110px] max-w-[110px] p-2.5 rounded-lg bg-bg-secondary/30 hover:bg-bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => navigate("wiki", { query: name })}
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-xl bg-bg-tertiary/40 border border-border/30 flex items-center justify-center">
                      <ClogItemImage name={name} className="w-10 h-10 object-contain" />
                      <span className="hidden w-10 h-10 items-center justify-center text-sm text-text-secondary/30">
                        {name[0]}
                      </span>
                    </div>
                    {item.count > 1 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-accent text-on-accent text-[10px] font-bold rounded-full px-1.5 min-w-[18px] text-center leading-[18px] shadow-sm shadow-black/30">
                        {item.count}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-text-primary text-center leading-tight w-full line-clamp-2">
                    {name}
                  </span>
                  {date && (
                    <span className="text-[9px] text-text-secondary/40">
                      {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tab bar ── */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {Object.keys(schema?.tabs ?? {}).map((tab) => {
          const stats = tabStats[tab];
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedCategory(null); }}
              aria-pressed={isActive}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-accent text-on-accent"
                  : "text-text-secondary hover:bg-bg-secondary/50"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {stats && (
                <span className={`tabular-nums ${isActive ? "text-on-accent/70" : "text-text-secondary/40"}`}>
                  {stats.obtained}/{stats.total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Two-column: categories + items ── */}
      <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
        {/* Category sidebar */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text-secondary/50 mb-2 px-1">
            {activeTab.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </div>
          <div className="space-y-0.5 max-h-[60vh] overflow-y-auto pr-1">
            {schemaCategories.map((cat) => {
              const isComplete = cat.obtained === cat.total && cat.total > 0;
              const isActive = selectedCategory === cat.slug;
              const pct = cat.total > 0 ? (cat.obtained / cat.total) * 100 : 0;

              return (
                <button
                  key={cat.slug}
                  onClick={() => {
                    setSelectedCategory(cat.slug);
                    setItemFilter("all");
                    // Scroll the items panel into view on narrow layouts where it stacks below.
                    if (window.innerWidth < 1280) {
                      setTimeout(
                        () => itemsPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
                        80
                      );
                    }
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                    isActive
                      ? "bg-accent/10 border border-accent/25"
                      : "hover:bg-bg-secondary/50 border border-transparent"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium truncate ${isComplete ? "text-success" : "text-text-primary"}`}>
                      {cat.catName}
                    </div>
                    <div className="mt-1 h-0.5 w-full rounded-full bg-bg-tertiary overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isComplete ? "bg-success" : "bg-accent/60"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-text-secondary/50 tabular-nums shrink-0">
                    {cat.obtained}/{cat.total}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Items panel */}
        <div ref={itemsPanelRef}>
          {!selectedCategory || !activeSchemaCat ? (
            <div className="py-12 text-center text-sm text-text-secondary">
              Select a category to view items
            </div>
          ) : (
            <>
              {/* Category header */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className={`text-base font-semibold ${activeSchemaCat.obtained === activeSchemaCat.total ? "text-success" : ""}`}>
                    {activeSchemaCat.catName}
                  </h3>
                  <div className="text-xs text-text-secondary mt-0.5 tabular-nums">
                    {activeSchemaCat.obtained} / {activeSchemaCat.total} items
                  </div>
                </div>
                <div className="flex gap-1">
                  {(["all", "obtained", "missing"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setItemFilter(f)}
                      aria-pressed={itemFilter === f}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        itemFilter === f
                          ? "bg-accent text-on-accent"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {f === "all" ? "All" : f === "obtained" ? "Obtained" : "Missing"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items icon grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {activeCatItems.map((item) => {
                  const isObtained = item.count > 0;
                  const name = resolveName(item);
                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate("market", { query: name, select: "1" })}
                      className={`group flex flex-col items-center gap-1 p-2 rounded-lg transition-all cursor-pointer ${
                        isObtained
                          ? "bg-success/6 hover:bg-success/12 hover:scale-105"
                          : "opacity-35 hover:opacity-80 hover:scale-105"
                      }`}
                      title={`${name}${isObtained ? ` (×${item.count})` : " — not obtained"}`}
                    >
                      <div className="relative">
                        <div className={`w-11 h-11 rounded-lg border flex items-center justify-center transition-all ${
                          isObtained
                            ? "bg-bg-tertiary/40 border-success/20 group-hover:border-success/50 group-hover:bg-bg-tertiary/70"
                            : "bg-bg-tertiary/15 border-border/15 group-hover:border-border/40 group-hover:bg-bg-tertiary/30"
                        }`}>
                          <ClogItemImage
                            name={name}
                            className={`w-8 h-8 object-contain transition-all ${isObtained ? "group-hover:scale-110" : "grayscale group-hover:grayscale-0"}`}
                          />
                        </div>
                        {isObtained && item.count > 1 && (
                          <span className="absolute -top-1.5 -right-2 bg-accent text-on-accent text-[10px] font-bold rounded-full px-1.5 min-w-[18px] text-center leading-[18px] shadow-sm shadow-black/30">
                            {item.count}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] text-center leading-tight truncate max-w-full ${
                        isObtained ? "text-text-primary" : "text-text-secondary/50"
                      }`}>
                        {name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {activeCatItems.length === 0 && (
                <div className="py-8 text-center text-sm text-text-secondary">
                  {itemFilter === "obtained" ? "No obtained items in this category" :
                   itemFilter === "missing" ? "All items obtained!" :
                   "No items in this category"}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

interface Props {
  rsn: string;
}

export default function CollectionLog({ rsn }: Props) {
  const [templeData, setTempleData] = useState<TempleCollectionLog | null>(
    null
  );
  const [templeLoading, setTempleLoading] = useState(false);
  const [templeSynced, setTempleSynced] = useState<boolean | null>(null);
  const [templeError, setTempleError] = useState<string | null>(null);
  const [templeLastFetched, setTempleLastFetched] = useState<Date | null>(null);

  useEffect(() => {
    if (!rsn) return;

    // Clear previous RSN's cache so we fetch fresh data
    clearCacheKey(`temple-player-info:${rsn.toLowerCase()}`);
    clearCacheKey(`temple-clog:${rsn.toLowerCase()}`);

    let cancelled = false;
    setTempleData(null); // eslint-disable-line react-hooks/set-state-in-effect
    setTempleLoading(true);  
    setTempleError(null);  
    setTempleSynced(null);

    (async () => {
      try {
        const [info, clog] = await Promise.all([
          fetchTemplePlayerInfo(rsn),
          fetchTempleCollectionLog(rsn),
        ]);
        if (cancelled) return;

        // Check clog data directly — clog_synced flag may be missing from player_info
        const hasClogData = clog && Object.keys(clog.categories).length > 0;

        if (!hasClogData && (!info || !info.clog_synced)) {
          setTempleSynced(false);
          setTempleLoading(false);
          return;
        }

        setTempleSynced(true);
        if (hasClogData) {
          setTempleData(clog);
        }
        setTempleLastFetched(new Date());
        setTempleLoading(false);
      } catch (err: unknown) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to reach Temple OSRS";
        setTempleError(
          `Failed to reach Temple OSRS. Check your connection and try again. (${message})`
        );
        setTempleLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rsn]);

  const handleTempleRefresh = useCallback(() => {
    if (!rsn) return;
    clearCacheKey(`temple-player-info:${rsn.toLowerCase()}`);
    clearCacheKey(`temple-clog:${rsn.toLowerCase()}`);
    setTempleLoading(true);
    setTempleError(null);
    setTempleSynced(null);
    Promise.all([fetchTemplePlayerInfo(rsn), fetchTempleCollectionLog(rsn)])
      .then(([info, clog]) => {
        const hasClog = clog && Object.keys(clog.categories).length > 0;
        if (hasClog) {
          setTempleSynced(true);
          setTempleData(clog);
          setTempleLastFetched(new Date());
        } else if (info?.clog_synced) {
          setTempleSynced(true);
          setTempleLastFetched(new Date());
        } else {
          setTempleSynced(false);
        }
        setTempleLoading(false);
      })
      .catch(() => {
        setTempleError("Failed to reach Temple OSRS");
        setTempleLoading(false);
      });
  }, [rsn]);

  return (
    <div>
      <div className="flex items-start justify-between mb-1 gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Collection Log</h2>
        <div className="shrink-0 pt-1">
          <FreshnessStrip updatedAt={templeLastFetched} onRefresh={handleTempleRefresh} />
        </div>
      </div>
      <p className="text-xs text-text-secondary/60 mb-5">
        Live collection log synced from TempleOSRS. Click any item to look it up on the wiki.
      </p>

      {templeLoading && (
        <div className="mb-4 space-y-2">
          <div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-3/4" />
          <div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-1/2" />
        </div>
      )}

      {!templeLoading && templeError && (
        <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded px-3 py-2 mb-4">
          {templeError}
        </div>
      )}

      {!templeLoading && !templeError && rsn && templeSynced === false && (
        <div className="bg-bg-secondary/50 rounded-lg px-4 py-3 mb-4 space-y-2">
          <p className="text-sm font-medium text-text-primary">
            No collection log data found for {rsn}
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">
            To see your live collection log, install the <strong>Temple OSRS</strong> plugin
            in RuneLite and open your Collection Log in-game. Your data will be sent to Temple
            automatically.
          </p>
          <div className="flex gap-3 pt-1">
            <a
              href="https://templeosrs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent hover:text-accent-hover"
            >
              templeosrs.com
            </a>
            <button
              onClick={() => {
                clearCacheKey(`temple-player-info:${rsn.toLowerCase()}`);
                clearCacheKey(`temple-clog:${rsn.toLowerCase()}`);
                setTempleLoading(true);
                setTempleError(null);
                setTempleSynced(null);
                Promise.all([fetchTemplePlayerInfo(rsn), fetchTempleCollectionLog(rsn)])
                  .then(([info, clog]) => {
                    const hasClog = clog && Object.keys(clog.categories).length > 0;
                    if (hasClog) {
                      setTempleSynced(true);
                      setTempleData(clog);
                    } else if (info?.clog_synced) {
                      setTempleSynced(true);
                    } else {
                      setTempleSynced(false);
                    }
                    setTempleLoading(false);
                  })
                  .catch(() => {
                    setTempleError("Failed to reach Temple OSRS");
                    setTempleLoading(false);
                  });
              }}
              className="text-xs text-accent hover:text-accent-hover"
            >
              Check Again
            </button>
          </div>
        </div>
      )}

      {templeData && <TempleView data={templeData} />}
    </div>
  );
}
