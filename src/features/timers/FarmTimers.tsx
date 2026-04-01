import { useState, useEffect, useCallback } from "react";
import { PATCH_TYPES, PRESETS } from "../../lib/data/farm-timers";
import { loadJSON, saveJSON } from "../../lib/localStorage";
import { sendNotification } from "../../lib/notify";

const TIMERS_KEY = "runewise_timers";
const WIKI_IMG = "https://oldschool.runescape.wiki/images";

interface Timer {
  id: string;
  patchName: string;
  icon: string;
  startedAt: number;
  readyAt: number;
  notified: boolean;
}

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

export default function FarmTimers() {
  const [timers, setTimers] = useState<Timer[]>(() => loadJSON(TIMERS_KEY, []));
  const [now, setNow] = useState(() => Date.now());
  const [selectedPatch, setSelectedPatch] = useState(PATCH_TYPES[0].name);

  useEffect(() => { saveJSON(TIMERS_KEY, timers); }, [timers]);

  useEffect(() => {
    const interval = setInterval(() => {
      const t = Date.now();
      setNow(t);
      setTimers((prev) => {
        let changed = false;
        const next = prev.map((timer) => {
          if (!timer.notified && t >= timer.readyAt) {
            changed = true;
            sendNotification("Farm Timer", `${timer.patchName} is ready!`);
            return { ...timer, notified: true };
          }
          return timer;
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const removeTimer = useCallback((id: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearReady = useCallback(() => {
    setTimers((prev) => prev.filter((t) => Date.now() < t.readyAt));
  }, []);

  const readyCount = timers.filter((t) => now >= t.readyAt).length;

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-4">Farm & Birdhouse Timers</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => addPreset(preset.patches)}
            className="px-3 py-1.5 text-xs font-medium bg-bg-secondary border border-border rounded-lg hover:bg-bg-tertiary transition-colors"
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        <select
          value={selectedPatch}
          onChange={(e) => setSelectedPatch(e.target.value)}
          className="flex-1 bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
        >
          {PATCH_TYPES.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name} ({p.growthMinutes}m)
            </option>
          ))}
        </select>
        <button
          onClick={() => addTimer(selectedPatch)}
          className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
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
        <div className="text-center py-12 text-text-secondary">
          <p className="text-sm">No active timers.</p>
          <p className="text-xs mt-1">Start a timer or use a preset above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {timers.map((timer) => {
            const total = timer.readyAt - timer.startedAt;
            const elapsed = now - timer.startedAt;
            const progress = Math.min(1, elapsed / total);
            const ready = now >= timer.readyAt;
            const remaining = timer.readyAt - now;
            const color = ready ? "#22c55e" : "#3b82f6";

            return (
              <div
                key={timer.id}
                className={`relative bg-bg-secondary border border-border rounded-lg p-3 flex flex-col items-center gap-2 transition-all ${ready ? "border-success/40 shadow-[0_0_8px_rgba(34,197,94,0.15)]" : ""}`}
              >
                <button
                  onClick={() => removeTimer(timer.id)}
                  className="absolute top-1.5 right-2 text-text-secondary/40 hover:text-danger text-xs transition-colors"
                >
                  x
                </button>

                <div
                  className="w-16 h-16 rounded-full relative"
                  style={{
                    background: `conic-gradient(${color} ${progress * 360}deg, #242836 ${progress * 360}deg)`,
                  }}
                >
                  <div className="absolute inset-1 rounded-full bg-bg-secondary flex items-center justify-center">
                    <img
                      src={`${WIKI_IMG}/${timer.icon}`}
                      alt=""
                      className="w-6 h-6"
                      onError={(e) => {
                        const el = e.currentTarget;
                        el.style.display = "none";
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
      )}
    </div>
  );
}
