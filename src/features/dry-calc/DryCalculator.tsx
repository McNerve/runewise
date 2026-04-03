import { useState } from "react";
import { dropChance, killsForConfidence } from "../../lib/formulas/dry";
import { POPULAR_DROPS, DROP_CATEGORIES, type DropEntry } from "../../lib/data/drops";
import { itemIcon } from "../../lib/sprites";

export default function DryCalculator() {
  const [kills, setKills] = useState(0);
  const [rate, setRate] = useState(512);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDrop, setSelectedDrop] = useState<DropEntry | null>(null);

  const chance = kills > 0 && rate > 0 ? dropChance(kills, rate) * 100 : 0;
  const kills95 = rate > 0 ? killsForConfidence(rate, 0.95) : 0;
  const kills50 = rate > 0 ? killsForConfidence(rate, 0.50) : 0;

  const filteredDrops =
    selectedCategory === "All"
      ? POPULAR_DROPS
      : POPULAR_DROPS.filter((d) => d.category === selectedCategory);

  const selectDrop = (drop: DropEntry) => {
    setSelectedDrop(drop);
    setRate(Math.round(drop.rate));
    setKills(0);
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-4">Dry Calculator</h2>

      <div className="grid grid-cols-[1fr_280px] gap-4">
        {/* Calculator */}
        <div className="bg-bg-secondary rounded-lg p-4 space-y-4">
          {selectedDrop && (
            <div className="flex items-center gap-3 text-sm">
              <img
                src={itemIcon(selectedDrop.item)}
                alt=""
                className="w-8 h-8 shrink-0"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-text-primary font-medium">{selectedDrop.item}</div>
                <div className="text-xs text-text-secondary">{selectedDrop.source} · 1/{Math.round(selectedDrop.rate).toLocaleString()}</div>
              </div>
              <button
                onClick={() => { setSelectedDrop(null); setRate(512); setKills(0); }}
                className="text-xs text-text-secondary/50 hover:text-text-primary transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>
          )}
          {selectedDrop?.note && (
            <div className="text-[10px] text-warning/70 bg-warning/8 rounded px-2.5 py-1.5">
              {selectedDrop.note}
            </div>
          )}

          <div>
            <label className="block text-xs text-text-secondary mb-1">
              Drop Rate (1 in X)
            </label>
            <input
              type="number"
              min={1}
              value={rate || ""}
              onChange={(e) => {
                setRate(Number(e.target.value) || 0);
                setSelectedDrop(null);
              }}
              className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">
              Kill Count
            </label>
            <input
              type="number"
              min={0}
              value={kills || ""}
              onChange={(e) => setKills(Number(e.target.value) || 0)}
              className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="border-t border-border pt-4">
            <div className="section-kicker mb-3">Results</div>
            <div className="text-center mb-3">
              <span
                className={`text-4xl font-bold tabular-nums ${
                  chance >= 95
                    ? "text-danger"
                    : chance >= 75
                      ? "text-warning"
                      : "text-success"
                }`}
              >
                {chance.toFixed(1)}%
              </span>
              <p className="text-xs text-text-secondary mt-1">
                chance of receiving 1+ drops in {kills.toLocaleString()} kills
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-bg-tertiary rounded-full h-2 mb-4">
              <div
                className={`rounded-full h-2 transition-all ${
                  chance >= 95
                    ? "bg-danger"
                    : chance >= 75
                      ? "bg-warning"
                      : "bg-success"
                }`}
                style={{ width: `${Math.min(100, chance)}%` }}
              />
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">50% confidence</span>
                <span className="tabular-nums">{kills50.toLocaleString()} kills</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">95% confidence</span>
                <span className="tabular-nums">{kills95.toLocaleString()} kills</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Expected (1x rate)</span>
                <span className="tabular-nums">{Math.round(rate).toLocaleString()} kills</span>
              </div>
            </div>
          </div>
        </div>

        {/* Presets */}
        <div className="bg-bg-secondary rounded-lg p-3 overflow-y-auto max-h-[500px]">
          <div className="section-kicker mb-2">Drop Presets</div>
          <div className="flex flex-wrap gap-1 mb-3">
            <button
              onClick={() => setSelectedCategory("All")}
              aria-pressed={selectedCategory === "All"}
              className={`px-2 py-0.5 rounded text-xs ${
                selectedCategory === "All"
                  ? "bg-accent text-white"
                  : "bg-bg-tertiary text-text-secondary"
              }`}
            >
              Popular
            </button>
            {DROP_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                aria-pressed={selectedCategory === cat}
                className={`px-2 py-0.5 rounded text-xs ${
                  selectedCategory === cat
                    ? "bg-accent text-white"
                    : "bg-bg-tertiary text-text-secondary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-0.5">
            {filteredDrops.map((drop, i) => (
              <button
                key={`${drop.item}-${drop.source}-${i}`}
                onClick={() => selectDrop(drop)}
                className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                  selectedDrop === drop
                    ? "bg-accent/15 text-accent"
                    : "hover:bg-bg-tertiary text-text-secondary"
                }`}
              >
                <img
                  src={itemIcon(drop.item)}
                  alt=""
                  className="w-5 h-5 shrink-0"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <div className="min-w-0">
                  <div className="font-medium text-text-primary truncate">
                    {drop.item}
                  </div>
                  <div className="text-text-secondary/60">
                    {drop.source} · 1/{Math.round(drop.rate).toLocaleString()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
