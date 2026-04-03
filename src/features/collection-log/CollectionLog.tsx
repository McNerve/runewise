import { useState, useEffect, useMemo, useCallback } from "react";
import { COLLECTION_CATEGORIES, getTotalSlots } from "./data/slots";
import { loadJSON, saveJSON } from "../../lib/localStorage";
import { itemIcon, NAV_ICONS } from "../../lib/sprites";
import {
  fetchTempleCollectionLog,
  fetchTemplePlayerInfo,
  fetchTempleClogItemNames,
  type TempleCollectionLog,
} from "../../lib/api/temple";
import { clearCacheKey } from "../../lib/api/cache";
import EmptyState from "../../components/EmptyState";

const STORAGE_KEY = "runewise_collection_log";

type Mode = "temple" | "manual";

function loadObtained(): Set<string> {
  const data = loadJSON<string[]>(STORAGE_KEY, []);
  return new Set(data);
}

function saveObtained(obtained: Set<string>): void {
  saveJSON(STORAGE_KEY, [...obtained]);
}

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

// Temple clog categories grouped like the in-game Collection Log
const CLOG_TABS: Record<string, string[]> = {
  Bosses: [
    "Abyssal Sire", "Alchemical Hydra", "Amoxliatl", "Araxxor", "Barrows Chests",
    "Bryophyta", "Callisto And Artio", "Cerberus", "Chaos Elemental", "Chaos Fanatic",
    "Commander Zilyana", "Corporeal Beast", "Crazy Archaeologist", "Dagannoth Kings",
    "Deranged Archaeologist", "Doom Of Mokhaiotl", "Duke Sucellus", "General Graardor",
    "Giant Mole", "Grotesque Guardians", "Hespori", "Hueycoatl", "Kalphite Queen",
    "King Black Dragon", "Kraken", "Kree Arra", "Kril Tsutsaroth", "Moons Of Peril",
    "Nex", "Obor", "Phantom Muspah", "Royal Titans", "Sarachnis", "Scorpia", "Scurrius",
    "Shellbane Gryphon", "Skotizo", "Tempoross", "Thermonuclear Smoke Devil", "The Leviathan",
    "The Nightmare", "The Whisperer", "Vardorvis", "Venenatis And Spindel",
    "Vetion And Calvarion", "Vorkath", "Wintertodt", "Yama", "Zalcano", "Zulrah",
  ],
  Raids: ["Chambers Of Xeric", "Theatre Of Blood", "Tombs Of Amascut"],
  Clues: [
    "Beginner Treasure Trails", "Easy Treasure Trails", "Medium Treasure Trails",
    "Hard Treasure Trails", "Elite Treasure Trails", "Master Treasure Trails",
    "Gilded", "Third Age", "Mimic", "Shared Treasure Trail Rewards", "Scroll Cases",
  ],
  Minigames: [
    "Barbarian Assault", "Barracuda Trials", "Brimhaven Agility Arena", "Castle Wars",
    "Fishing Trawler", "Giants Foundry", "Gnome Restaurant", "Guardians Of The Rift",
    "Hallowed Sepulchre", "Last Man Standing", "Magic Training Arena", "Mahogany Homes",
    "Mastering Mixology", "Pest Control", "Rogues Den", "Shades Of Mortton", "Soul Wars",
    "Temple Trekking", "Tithe Farm", "Trouble Brewing", "Vale Totems", "Volcanic Mine",
  ],
  Other: [
    "Aerial Fishing", "All Pets", "Boat Paints", "Brutus", "Camdozaal", "Champions Challenge",
    "Chaos Druids", "Chompy Bird Hunting", "Colossal Wyrm Agility", "Creature Creation",
    "Cyclopes", "Forestry", "Fossil Island Notes", "Gloughs Experiments", "Hunter Guild",
    "Lost Schematics", "Monkey Backpacks", "Motherlode Mine", "My Notes", "Ocean Encounters",
    "Random Events", "Revenants", "Rooftop Agility", "Sailing Miscellaneous", "Sea Treasures",
    "Shayzien Armour", "Shooting Stars", "Skilling Pets", "Slayer", "The Fight Caves",
    "The Gauntlet", "The Inferno", "Fortis Colosseum", "Tormented Demons", "Tzhaar", "Miscellaneous",
  ],
};

type ItemFilter = "all" | "obtained" | "missing";

function TempleView({ data }: { data: TempleCollectionLog }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [itemFilter, setItemFilter] = useState<ItemFilter>("all");
  const [activeTab, setActiveTab] = useState<string>("Bosses");
  const [itemNames, setItemNames] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    fetchTempleClogItemNames()
      .then(setItemNames)
      .catch(() => {});
  }, []);

  const resolveName = useCallback(
    (item: { id: number; name?: string }) =>
      item.name ?? itemNames.get(item.id) ?? `Item ${item.id}`,
    [itemNames]
  );

  // Match Temple category slugs to our tab groups
  const matchTab = useCallback((catSlug: string): string => {
    const normalized = catSlug.toLowerCase().replace(/_/g, " ");
    for (const [tab, cats] of Object.entries(CLOG_TABS)) {
      if (cats.some((c) => c.toLowerCase() === normalized)) return tab;
    }
    return "Other";
  }, []);

  const sortedCategories = useMemo(() => {
    return Object.entries(data.categories).sort(([a], [b]) => a.localeCompare(b));
  }, [data.categories]);

  const tabCategories = useMemo(() => {
    return sortedCategories.filter(([catName]) => matchTab(catName) === activeTab);
  }, [sortedCategories, activeTab, matchTab]);

  const tabStats = useMemo(() => {
    const stats: Record<string, { obtained: number; total: number }> = {};
    for (const tab of Object.keys(CLOG_TABS)) {
      const cats = sortedCategories.filter(([name]) => matchTab(name) === tab);
      const obtained = cats.reduce((s, [, items]) => s + items.filter((i) => i.count > 0).length, 0);
      const total = cats.reduce((s, [, items]) => s + items.length, 0);
      stats[tab] = { obtained, total };
    }
    return stats;
  }, [sortedCategories, matchTab]);

  const completedCats = useMemo(
    () => sortedCategories.filter(([, items]) => items.length > 0 && items.every((i) => i.count > 0)).length,
    [sortedCategories]
  );

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

  // Selected category items
  const activeCategory = selectedCategory
    ? sortedCategories.find(([name]) => name === selectedCategory)
    : null;

  const activeCatItems = useMemo(() => {
    if (!activeCategory) return [];
    const [, items] = activeCategory;
    let filtered = [...items];
    if (itemFilter === "obtained") filtered = filtered.filter((i) => i.count > 0);
    if (itemFilter === "missing") filtered = filtered.filter((i) => i.count === 0);
    return filtered.sort((a, b) => {
      if (a.count > 0 !== b.count > 0) return a.count > 0 ? -1 : 1;
      return resolveName(a).localeCompare(resolveName(b));
    });
  }, [activeCategory, itemFilter, resolveName]);

  const activeCatObtained = activeCategory
    ? activeCategory[1].filter((i) => i.count > 0).length
    : 0;
  const activeCatTotal = activeCategory ? activeCategory[1].length : 0;

  return (
    <>
      {/* ── Summary stats ── */}
      <div className="grid grid-cols-3 gap-px rounded-xl overflow-hidden border border-border/40 mb-6">
        <div className="bg-bg-secondary/50 px-4 py-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-text-secondary/50">Collections</div>
          <div className="text-lg font-bold tabular-nums mt-1">{data.finished} / {data.total}</div>
          <div className="text-[10px] text-text-secondary/40">{((data.finished / data.total) * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-bg-secondary/50 px-4 py-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-text-secondary/50">Categories</div>
          <div className="text-lg font-bold tabular-nums mt-1">{completedCats} / {sortedCategories.length}</div>
          <div className="text-[10px] text-text-secondary/40">completed</div>
        </div>
        <div className="bg-bg-secondary/50 px-4 py-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-text-secondary/50">Source</div>
          <div className="text-sm font-medium mt-1 text-accent">TempleOSRS</div>
          <div className="text-[10px] text-text-secondary/40">live sync</div>
        </div>
      </div>

      {/* ── Recent items ── */}
      {recentItems.length > 0 && (
        <div className="mb-6">
          <div className="text-[10px] uppercase tracking-wider text-text-secondary/50 mb-2">Recently Obtained</div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentItems.map((item) => {
              const name = resolveName(item);
              const date = item.obtained_at ? new Date(item.obtained_at + " UTC") : null;
              return (
                <div key={`recent-${item.id}-${item.obtained_at}`} className="flex flex-col items-center gap-1.5 min-w-[80px]">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-bg-tertiary/50 border border-border/30 flex items-center justify-center">
                      <img
                        src={itemIcon(name)}
                        alt=""
                        className="w-8 h-8 object-contain"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    </div>
                    {item.count > 1 && (
                      <span className="absolute -top-1 -right-1 bg-accent text-white text-[9px] font-bold rounded-full px-1 min-w-[16px] text-center">
                        {item.count}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-text-primary text-center truncate max-w-[80px]">{name}</span>
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

      {/* ── Tab bar (Bosses / Raids / Clues / Minigames / Other) ── */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {Object.keys(CLOG_TABS).map((tab) => {
          const stats = tabStats[tab];
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedCategory(null); }}
              aria-pressed={isActive}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:bg-bg-secondary/50"
              }`}
            >
              {tab}
              {stats && (
                <span className={`tabular-nums ${isActive ? "text-white/70" : "text-text-secondary/40"}`}>
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
          <div className="text-[10px] uppercase tracking-wider text-text-secondary/50 mb-2 px-1">{activeTab}</div>
          <div className="space-y-0.5 max-h-[60vh] overflow-y-auto pr-1">
            {tabCategories.map(([catName, items]) => {
              const catObtained = items.filter((i) => i.count > 0).length;
              const isComplete = catObtained === items.length && items.length > 0;
              const isActive = selectedCategory === catName;
              const pct = items.length > 0 ? (catObtained / items.length) * 100 : 0;

              return (
                <button
                  key={catName}
                  onClick={() => { setSelectedCategory(catName); setItemFilter("all"); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                    isActive
                      ? "bg-accent/10 border border-accent/25"
                      : "hover:bg-bg-secondary/50 border border-transparent"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium truncate ${isComplete ? "text-success" : "text-text-primary"}`}>
                      {catName}
                    </div>
                    <div className="mt-1 h-0.5 w-full rounded-full bg-bg-tertiary overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isComplete ? "bg-success" : "bg-accent/60"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-text-secondary/50 tabular-nums shrink-0">
                    {catObtained}/{items.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Items panel */}
        <div>
          {!selectedCategory ? (
            <div className="py-12 text-center text-sm text-text-secondary">
              Select a category to view items
            </div>
          ) : activeCategory ? (
            <>
              {/* Category header */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className={`text-base font-semibold ${activeCatObtained === activeCatTotal && activeCatTotal > 0 ? "text-success" : ""}`}>
                    {selectedCategory}
                  </h3>
                  <div className="text-xs text-text-secondary mt-0.5 tabular-nums">
                    {activeCatObtained} / {activeCatTotal} items
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
                          ? "bg-accent text-white"
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
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                        isObtained
                          ? "bg-success/6 hover:bg-success/10"
                          : "opacity-40 hover:opacity-60"
                      }`}
                      title={`${name}${isObtained ? ` (×${item.count})` : " — not obtained"}`}
                    >
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${
                          isObtained
                            ? "bg-bg-tertiary/40 border-success/20"
                            : "bg-bg-tertiary/20 border-border/20"
                        }`}>
                          <img
                            src={itemIcon(name)}
                            alt=""
                            className={`w-7 h-7 object-contain ${isObtained ? "" : "grayscale"}`}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                        {isObtained && item.count > 1 && (
                          <span className="absolute -top-1 -right-1.5 bg-success text-white text-[8px] font-bold rounded-full px-1 min-w-[14px] text-center leading-[14px]">
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
          ) : null}
        </div>
      </div>
    </>
  );
}

function ManualView() {
  const [obtained, setObtained] = useState<Set<string>>(loadObtained);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const totalSlots = useMemo(() => getTotalSlots(), []);
  const totalObtained = obtained.size;

  const toggle = useCallback((slot: string) => {
    setObtained((prev) => {
      const next = new Set(prev);
      if (next.has(slot)) next.delete(slot);
      else next.add(slot);
      saveObtained(next);
      return next;
    });
  }, []);

  return (
    <>
      {totalObtained === 0 ? (
        <EmptyState
          icon={NAV_ICONS["collection-log"]}
          title="No items collected yet"
          description="Expand a category below and click items to start tracking."
        />
      ) : (
        <div className="flex items-center gap-4 mb-6">
          <ProgressRing obtained={totalObtained} total={totalSlots} size={48} />
          <div>
            <div className="text-lg font-bold tabular-nums">
              {totalObtained} / {totalSlots}
            </div>
            <div className="text-xs text-text-secondary">
              {((totalObtained / totalSlots) * 100).toFixed(1)}% complete
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {COLLECTION_CATEGORIES.map((cat) => {
          const catObtained = cat.slots.filter((s) => obtained.has(s)).length;
          const isExpanded = expandedCategory === cat.name;
          const isComplete = catObtained === cat.slots.length;

          return (
            <div key={cat.name}>
              <button
                onClick={() =>
                  setExpandedCategory(isExpanded ? null : cat.name)
                }
                aria-expanded={isExpanded}
                className="w-full flex items-center gap-3 py-2 px-2 rounded hover:bg-bg-secondary/50 transition-colors"
              >
                <ProgressRing obtained={catObtained} total={cat.slots.length} />
                <span
                  className={`text-sm flex-1 text-left ${isComplete ? "text-success" : ""}`}
                >
                  {cat.name}
                </span>
                <span className="text-xs text-text-secondary tabular-nums">
                  {catObtained}/{cat.slots.length}
                </span>
                <span className="text-xs text-text-secondary/40">
                  {isExpanded ? "▾" : "▸"}
                </span>
              </button>

              {isExpanded && (
                <div className="ml-12 mb-3 grid grid-cols-2 gap-1">
                  {cat.slots.map((slot) => {
                    const isObtained = obtained.has(slot);
                    return (
                      <button
                        key={slot}
                        onClick={() => toggle(slot)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors ${
                          isObtained
                            ? "bg-success/8 text-success"
                            : "hover:bg-bg-secondary/50 text-text-secondary"
                        }`}
                      >
                        <img
                          src={itemIcon(slot)}
                          alt=""
                          className={`w-5 h-5 shrink-0 ${isObtained ? "" : "opacity-30"}`}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <span className="truncate">{slot}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
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
  const [mode, setMode] = useState<Mode>("manual");

  useEffect(() => {
    if (!rsn) return;

    // Clear previous RSN's cache so we fetch fresh data
    clearCacheKey(`temple-player-info:${rsn.toLowerCase()}`);
    clearCacheKey(`temple-clog:${rsn.toLowerCase()}`);

    let cancelled = false;
    setTempleData(null);
    setTempleLoading(true); // eslint-disable-line react-hooks/set-state-in-effect -- loading state for async fetch
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
          setMode("temple");
        }
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

  const hasTemple = templeData && Object.keys(templeData.categories).length > 0;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">Collection Log</h2>
      <p className="text-xs text-text-secondary/60 mb-5">
        {mode === "temple"
          ? "Live collection log synced from TempleOSRS."
          : "Track your collection log manually. Click items to toggle obtained."}
      </p>

      {hasTemple && (
        <div className="flex gap-1 mb-6">
          {(["temple", "manual"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                mode === m
                  ? "bg-accent text-white"
                  : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
              }`}
            >
              {m === "temple" ? "Temple" : "Manual"}
            </button>
          ))}
        </div>
      )}

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
                    if (info?.clog_synced) {
                      setTempleSynced(true);
                      if (clog && Object.keys(clog.categories).length > 0) {
                        setTempleData(clog);
                        setMode("temple");
                      }
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

      {mode === "temple" && templeData ? (
        <TempleView data={templeData} />
      ) : (
        <ManualView />
      )}
    </div>
  );
}
