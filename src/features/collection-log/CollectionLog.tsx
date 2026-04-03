import { useState, useEffect, useMemo, useCallback } from "react";
import { COLLECTION_CATEGORIES, getTotalSlots } from "./data/slots";
import { loadJSON, saveJSON } from "../../lib/localStorage";
import { itemIcon, NAV_ICONS } from "../../lib/sprites";
import {
  fetchTempleCollectionLog,
  fetchTemplePlayerInfo,
  type TempleCollectionLog,
} from "../../lib/api/temple";
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

function TempleView({ data }: { data: TempleCollectionLog }) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const sortedCategories = useMemo(() => {
    return Object.entries(data.categories).sort(([a], [b]) =>
      a.localeCompare(b)
    );
  }, [data.categories]);

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <ProgressRing obtained={data.finished} total={data.total} size={48} />
        <div>
          <div className="text-lg font-bold tabular-nums">
            {data.finished} / {data.total}
          </div>
          <div className="text-xs text-text-secondary">
            {((data.finished / data.total) * 100).toFixed(1)}% complete
          </div>
        </div>
        <span className="ml-auto text-[10px] text-text-secondary/50 bg-bg-secondary px-2 py-0.5 rounded">
          via TempleOSRS
        </span>
      </div>

      <div className="space-y-2">
        {sortedCategories.map(([catName, items]) => {
          const catObtained = items.filter((i) => i.count > 0).length;
          const isExpanded = expandedCategory === catName;
          const isComplete = catObtained === items.length;

          return (
            <div key={catName}>
              <button
                onClick={() =>
                  setExpandedCategory(isExpanded ? null : catName)
                }
                aria-expanded={isExpanded}
                className="w-full flex items-center gap-3 py-2 px-2 rounded hover:bg-bg-secondary/50 transition-colors"
              >
                <ProgressRing obtained={catObtained} total={items.length} />
                <span
                  className={`text-sm flex-1 text-left ${isComplete ? "text-success" : ""}`}
                >
                  {catName}
                </span>
                <span className="text-xs text-text-secondary tabular-nums">
                  {catObtained}/{items.length}
                </span>
                <span className="text-xs text-text-secondary/40">
                  {isExpanded ? "▾" : "▸"}
                </span>
              </button>

              {isExpanded && (
                <div className="ml-12 mb-3 grid grid-cols-2 gap-1">
                  {[...items]
                    .sort((a, b) => {
                      if (a.count > 0 !== b.count > 0)
                        return a.count > 0 ? -1 : 1;
                      return (a.name ?? "").localeCompare(b.name ?? "");
                    })
                    .map((item) => {
                      const isObtained = item.count > 0;
                      const name = item.name ?? `Item ${item.id}`;
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm ${
                            isObtained
                              ? "bg-success/8 text-success"
                              : "text-text-secondary"
                          }`}
                        >
                          <img
                            src={itemIcon(name)}
                            alt=""
                            className={`w-5 h-5 shrink-0 ${isObtained ? "" : "opacity-30"}`}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          <span className="truncate">{name}</span>
                          {isObtained && item.count > 1 && (
                            <span className="ml-auto text-[10px] text-success/60 tabular-nums shrink-0">
                              ×{item.count}
                            </span>
                          )}
                        </div>
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

    let cancelled = false;
    setTempleLoading(true); // eslint-disable-line react-hooks/set-state-in-effect -- loading state for async fetch
    setTempleError(null);

    (async () => {
      try {
        const [info, clog] = await Promise.all([
          fetchTemplePlayerInfo(rsn),
          fetchTempleCollectionLog(rsn),
        ]);
        if (cancelled) return;

        if (!info || !info.clog_synced) {
          setTempleSynced(false);
          setTempleLoading(false);
          return;
        }

        setTempleSynced(true);
        if (clog && Object.keys(clog.categories).length > 0) {
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
