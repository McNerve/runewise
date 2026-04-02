import { useState, useMemo, useCallback } from "react";
import { COLLECTION_CATEGORIES, getTotalSlots } from "./data/slots";
import { loadJSON, saveJSON } from "../../lib/localStorage";
import { itemIcon, NAV_ICONS } from "../../lib/sprites";
import EmptyState from "../../components/EmptyState";

const STORAGE_KEY = "runewise_collection_log";

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

export default function CollectionLog() {
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
    <div>
      <h2 className="text-xl font-semibold mb-1">Collection Log</h2>
      <p className="text-xs text-text-secondary/60 mb-5">
        Track your collection log manually. Click items to toggle obtained.
      </p>

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

      {/* Categories */}
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
                className="w-full flex items-center gap-3 py-2 px-2 rounded hover:bg-bg-secondary/50 transition-colors"
              >
                <ProgressRing obtained={catObtained} total={cat.slots.length} />
                <span className={`text-sm flex-1 text-left ${isComplete ? "text-success" : ""}`}>
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
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
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
    </div>
  );
}
