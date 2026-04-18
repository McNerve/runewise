import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { PATCH_TYPES, PATCH_CATEGORIES, PRESETS, type PatchType } from "../../lib/data/farm-timers";
import { loadJSON, saveJSON } from "../../lib/localStorage";
import { sendNotification } from "../../lib/notify";
import { WIKI_IMG } from "../../lib/sprites";
import EmptyState from "../../components/EmptyState";

// Categories where selecting a specific crop variety matters for timers
const CONFIGURABLE_CATEGORIES = new Set(["Herbs", "Flowers", "Allotments", "Bushes", "Cactus", "Trees", "Fruit Trees", "Hardwood", "Special", "Birdhouse"]);

function getCategoryForPatch(name: string): string | undefined {
  return PATCH_TYPES.find((p) => p.name === name)?.category;
}

function isConfigurablePreset(patches: string[]): boolean {
  return patches.some((p) => CONFIGURABLE_CATEGORIES.has(getCategoryForPatch(p) ?? ""));
}

interface PresetSlot {
  originalPatch: string;
  selectedPatch: string;
  alternatives: PatchType[];
}

const FarmProfit = lazy(() => import("./FarmProfit"));

const TIMERS_KEY = "runewise_timers";

interface Timer {
  id: string;
  patchName: string;
  icon: string;
  startedAt: number;
  readyAt: number;
  notified: boolean;
  repeat?: boolean;
}

type Tab = "timers" | "overview" | "profit";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Ready!";
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

interface CategoryStatus {
  category: string;
  icon: string;
  active: number;
  ready: number;
  total: number;
  nextReady: number | null;
  patchTypes: number;
}

function FarmOverview({ timers, now, onGoToTimers }: { timers: Timer[]; now: number; onGoToTimers: () => void }) {
  const categories = useMemo<CategoryStatus[]>(() => {
    return PATCH_CATEGORIES.map((cat) => {
      const catTimers = timers.filter((t) => {
        const patch = PATCH_TYPES.find((p) => p.name === t.patchName);
        return patch?.category === cat;
      });
      const ready = catTimers.filter((t) => now >= t.readyAt).length;
      const active = catTimers.length - ready;
      const growing = catTimers.filter((t) => now < t.readyAt);
      const nextReady =
        growing.length > 0
          ? Math.min(...growing.map((t) => t.readyAt)) - now
          : null;
      const patchTypes = PATCH_TYPES.filter((p) => p.category === cat).length;
      const firstPatch = PATCH_TYPES.find((p) => p.category === cat);

      return {
        category: cat,
        icon: firstPatch?.icon ?? "",
        active,
        ready,
        total: catTimers.length,
        nextReady,
        patchTypes,
      };
    });
  }, [timers, now]);

  const activeCategories = categories.filter((c) => c.total > 0);
  const emptyCategories = categories.filter((c) => c.total === 0);

  return (
    <div>
      {activeCategories.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-sm text-text-secondary mb-1">Your farm run at a glance</div>
          <p className="text-xs text-text-secondary/60 mb-4 max-w-sm mx-auto">
            Overview summarises every category you have growing &mdash; ready counts, next harvest, and idle patches. Start a timer to fill it in.
          </p>
          <button
            onClick={onGoToTimers}
            className="px-3 py-1.5 text-xs font-medium bg-accent text-on-accent rounded-lg hover:bg-accent-hover transition-colors"
          >
            Go to Timers
          </button>
        </div>
      ) : (
        <>
          <div className="section-kicker mb-3">
            Active ({activeCategories.reduce((s, c) => s + c.total, 0)} timers)
          </div>
          <div className="space-y-2 mb-6">
            {activeCategories.map((cat) => {
              const allReady = cat.ready > 0 && cat.active === 0;
              const someReady = cat.ready > 0 && cat.active > 0;

              return (
                <div
                  key={cat.category}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
                    allReady
                      ? "bg-success/8 border-success/30"
                      : someReady
                        ? "bg-warning/6 border-warning/20"
                        : "bg-bg-tertiary border-border"
                  }`}
                >
                  <img
                    src={`${WIKI_IMG}/${cat.icon}`}
                    alt=""
                    className="w-6 h-6 shrink-0"
                    onError={(e) => {
                      const el = e.currentTarget;
                      const parent = el.parentElement;
                      if (parent) {
                        const fallback = document.createElement("span");
                        fallback.className = "w-6 h-6 flex items-center justify-center text-[10px] text-text-secondary bg-bg-tertiary rounded";
                        fallback.textContent = cat.category[0];
                        parent.replaceChild(fallback, el);
                      }
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{cat.category}</div>
                    <div className="text-[11px] text-text-secondary">
                      {cat.ready > 0 && (
                        <span className="text-success font-medium">
                          {cat.ready} ready
                        </span>
                      )}
                      {cat.ready > 0 && cat.active > 0 && (
                        <span className="text-text-secondary/40"> · </span>
                      )}
                      {cat.active > 0 && (
                        <span>{cat.active} growing</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Mini progress bar */}
                    <div className="w-16 h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${cat.total > 0 ? (cat.ready / cat.total) * 100 : 0}%`,
                          backgroundColor: allReady
                            ? "var(--color-success)"
                            : "var(--color-warning)",
                        }}
                      />
                    </div>
                    <span
                      className={`text-xs tabular-nums font-mono ${allReady ? "text-success font-semibold" : "text-text-secondary"}`}
                    >
                      {cat.nextReady != null
                        ? formatCountdown(cat.nextReady)
                        : "Ready!"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {emptyCategories.length > 0 && activeCategories.length > 0 && (
        <>
          <div className="section-kicker mb-3">
            Idle ({emptyCategories.length} categories)
          </div>
          <div className="flex flex-wrap gap-2">
            {emptyCategories.map((cat) => (
              <div
                key={cat.category}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-bg-secondary/50 text-text-secondary/40 text-xs"
              >
                <img
                  src={`${WIKI_IMG}/${cat.icon}`}
                  alt=""
                  className="w-4 h-4 opacity-30"
                  onError={(e) => {
                    const el = e.currentTarget;
                    const parent = el.parentElement;
                    if (parent) {
                      const fallback = document.createElement("span");
                      fallback.className = "w-4 h-4 flex items-center justify-center text-[10px] text-text-secondary bg-bg-tertiary rounded";
                      fallback.textContent = cat.category[0];
                      parent.replaceChild(fallback, el);
                    }
                  }}
                />
                {cat.category}
                <span className="text-text-secondary/20">
                  ({cat.patchTypes})
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function FarmTimers() {
  const [timers, setTimers] = useState<Timer[]>(() => loadJSON(TIMERS_KEY, []));
  const [now, setNow] = useState(() => Date.now());
  const [selectedPatch, setSelectedPatch] = useState(PATCH_TYPES[0].name);
  const [tab, setTab] = useState<Tab>("timers");
  const [configuringPreset, setConfiguringPreset] = useState<{ name: string; slots: PresetSlot[] } | null>(null);

  useEffect(() => { saveJSON(TIMERS_KEY, timers); }, [timers]);

  const hasGrowingTimers = timers.some((t) => now < t.readyAt);

  useEffect(() => {
    if (!hasGrowingTimers) return;
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [hasGrowingTimers]);

  // Notifications + auto-repeat — runs when `now` ticks
  useEffect(() => {
    const newlyReady = timers.filter((timer) => !timer.notified && now >= timer.readyAt);
    if (newlyReady.length > 0) {
      for (const timer of newlyReady) {
        sendNotification("Farm Timer", `${timer.patchName} is ready!`);
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- gated behind length check, fires once per timer
      setTimers((prev) =>
        prev.map((timer) => {
          if (!timer.notified && now >= timer.readyAt) {
            if (timer.repeat) {
              const duration = timer.readyAt - timer.startedAt;
              return { ...timer, startedAt: timer.readyAt, readyAt: timer.readyAt + duration, notified: false };
            }
            return { ...timer, notified: true };
          }
          return timer;
        })
      );
    }
  }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

  const addTimer = useCallback((patchName: string) => {
    const patch = PATCH_TYPES.find((p) => p.name === patchName);
    if (!patch) return;
    const now = Date.now();
    setTimers((prev) => [
      ...prev,
      {
        id: `${patchName}-${now}-${Math.random().toString(36).slice(2, 6)}`,
        patchName: patch.name,
        icon: patch.icon,
        startedAt: now,
        readyAt: now + patch.growthMinutes * 60_000,
        notified: false,
      },
    ]);
  }, []);

  const addPreset = useCallback((patches: string[]) => {
    const now = Date.now();
    const newTimers = patches.map((name, i) => {
      const patch = PATCH_TYPES.find((p) => p.name === name);
      if (!patch) return null;
      return {
        id: `${name}-${now}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        patchName: patch.name,
        icon: patch.icon,
        startedAt: now,
        readyAt: now + patch.growthMinutes * 60_000,
        notified: false,
      };
    }).filter((t): t is Timer => t != null);
    setTimers((prev) => [...prev, ...newTimers]);
  }, []);

  const toggleRepeat = useCallback((id: string) => {
    setTimers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, repeat: !t.repeat } : t))
    );
  }, []);

  const removeTimer = useCallback((id: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearReady = useCallback(() => {
    setTimers((prev) => prev.filter((t) => Date.now() < t.readyAt));
  }, []);

  const readyCount = timers.filter((t) => now >= t.readyAt).length;

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-semibold tracking-tight">Farm & Birdhouse Timers</h2>
      <p className="text-sm text-text-secondary mb-4">Track growth cycles for farming patches and birdhouse runs.</p>

      <div className="flex gap-1 mb-6">
        {(
          [
            { id: "timers", label: "Timers" },
            { id: "overview", label: "Overview" },
            { id: "profit", label: "Profit" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-accent text-on-accent"
                : "bg-bg-tertiary text-text-secondary hover:bg-bg-secondary"
            }`}
          >
            {t.label}
            {t.id === "overview" && readyCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-success text-white text-[10px] font-bold">
                {readyCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "profit" ? (
        <Suspense fallback={<div className="py-8 text-center"><div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-3/4 mx-auto" /></div>}>
          <FarmProfit />
        </Suspense>
      ) : tab === "overview" ? (
        <FarmOverview timers={timers} now={now} onGoToTimers={() => setTab("timers")} />
      ) : (
        <>
          <div className="section-kicker mb-2">Quick Presets</div>
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  if (isConfigurablePreset(preset.patches)) {
                    const slots: PresetSlot[] = preset.patches.map((patchName) => {
                      const category = getCategoryForPatch(patchName);
                      const alternatives = category
                        ? PATCH_TYPES.filter((p) => p.category === category)
                        : [PATCH_TYPES.find((p) => p.name === patchName)].filter(Boolean) as PatchType[];
                      return { originalPatch: patchName, selectedPatch: patchName, alternatives };
                    });
                    setConfiguringPreset({ name: preset.name, slots });
                  } else {
                    addPreset(preset.patches);
                  }
                }}
                className="px-3 py-1.5 text-xs font-medium bg-bg-tertiary border border-border rounded-lg hover:bg-bg-secondary transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>

          {configuringPreset && (
            <div className="mb-4 rounded-xl border border-border bg-bg-tertiary p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{configuringPreset.name} — Configure Patches</span>
                <button
                  onClick={() => setConfiguringPreset(null)}
                  className="text-text-secondary/50 hover:text-text-primary text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
              <div className="space-y-2">
                {configuringPreset.slots.map((slot, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <img
                      src={`${WIKI_IMG}/${PATCH_TYPES.find((p) => p.name === slot.selectedPatch)?.icon ?? ""}`}
                      alt=""
                      className="w-5 h-5 shrink-0"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    <select
                      value={slot.selectedPatch}
                      onChange={(e) => {
                        setConfiguringPreset((prev) => {
                          if (!prev) return prev;
                          const updated = [...prev.slots];
                          updated[i] = { ...updated[i], selectedPatch: e.target.value };
                          return { ...prev, slots: updated };
                        });
                      }}
                      className="flex-1 bg-bg-tertiary border border-border rounded px-2 py-1 text-xs"
                    >
                      {slot.alternatives.map((alt) => (
                        <option key={alt.name} value={alt.name}>
                          {alt.name} ({formatDuration(alt.growthMinutes)})
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  addPreset(configuringPreset.slots.map((s) => s.selectedPatch));
                  setConfiguringPreset(null);
                }}
                className="w-full py-1.5 text-xs font-medium bg-accent text-on-accent rounded-lg hover:bg-accent-hover transition-colors"
              >
                Start {configuringPreset.slots.length} Timers
              </button>
            </div>
          )}

          <div className="flex gap-2 mb-6">
            <select
              value={selectedPatch}
              onChange={(e) => setSelectedPatch(e.target.value)}
              className="flex-1 bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm"
            >
              {PATCH_TYPES.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({formatDuration(p.growthMinutes)})
                </option>
              ))}
            </select>
            <button
              onClick={() => addTimer(selectedPatch)}
              className="px-4 py-2 text-sm font-medium bg-accent text-on-accent rounded-lg hover:bg-accent-hover transition-colors"
            >
              Start Timer
            </button>
          </div>

          {readyCount > 0 && (
            <button
              onClick={clearReady}
              className="mb-4 text-xs text-text-secondary hover:text-danger transition-colors"
            >
              Clear {readyCount} ready timer{readyCount > 1 ? "s" : ""}
            </button>
          )}

          {timers.length === 0 ? (
            <EmptyState
              title="No active timers"
              description="Start a timer or use a preset above to track your farm runs."
            />
          ) : (
            <>
            <div className="section-kicker mb-3">
              Active Timers ({timers.length})
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {timers.map((timer) => {
                const total = timer.readyAt - timer.startedAt;
                const elapsed = now - timer.startedAt;
                const progress = Math.min(1, elapsed / total);
                const ready = now >= timer.readyAt;
                const remaining = timer.readyAt - now;
                const color = ready ? "var(--color-success)" : "var(--color-accent)";

                return (
                  <div
                    key={timer.id}
                    className={`relative bg-bg-tertiary border border-border rounded-lg p-3 flex flex-col items-center gap-2 transition-all ${ready ? "border-success/40 shadow-[0_0_8px_rgba(34,197,94,0.15)]" : ""}`}
                  >
                    <button
                      onClick={() => toggleRepeat(timer.id)}
                      className={`absolute top-1.5 right-8 text-xs transition-colors ${timer.repeat ? "text-accent" : "text-text-secondary/40 hover:text-accent"}`}
                      title={timer.repeat ? "Auto-repeat on" : "Auto-repeat off"}
                    >
                      ↻
                    </button>
                    <button
                      onClick={() => removeTimer(timer.id)}
                      className="absolute top-1.5 right-2 text-text-secondary/40 hover:text-danger text-xs transition-colors"
                    >
                      x
                    </button>

                    <div
                      className="w-16 h-16 rounded-full relative"
                      style={{
                        background: `conic-gradient(${color} ${progress * 360}deg, var(--color-bg-tertiary) ${progress * 360}deg)`,
                      }}
                    >
                      <div className="absolute inset-1 rounded-full bg-bg-tertiary flex items-center justify-center">
                        <img
                          src={`${WIKI_IMG}/${timer.icon}`}
                          alt=""
                          className="w-6 h-6"
                          onError={(e) => {
                            const el = e.currentTarget;
                            const parent = el.parentElement;
                            if (parent) {
                              const fallback = document.createElement("span");
                              fallback.className = "w-6 h-6 flex items-center justify-center text-[10px] text-text-secondary bg-bg-tertiary rounded";
                              fallback.textContent = timer.patchName[0];
                              parent.replaceChild(fallback, el);
                            }
                          }}
                        />
                      </div>
                    </div>

                    <span className="text-xs font-medium text-center leading-tight">
                      {timer.patchName}
                    </span>
                    <span
                      className={`text-xs font-mono ${ready ? "text-success font-semibold" : "text-text-secondary"}`}
                    >
                      {formatCountdown(remaining)}
                    </span>
                  </div>
                );
              })}
            </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
