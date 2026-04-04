import { useState } from "react";
import { XP_TABLE_VIRTUAL, MAX_XP } from "../../lib/formulas/xp";

export default function XpTable() {
  const [selected, setSelected] = useState<number | null>(null);

  const selectedRow = selected ? XP_TABLE_VIRTUAL.find((r) => r.level === selected) : null;
  const prevRow = selected && selected > 1 ? XP_TABLE_VIRTUAL.find((r) => r.level === selected - 1) : null;
  const nextRow = selected && selected < 126 ? XP_TABLE_VIRTUAL.find((r) => r.level === selected + 1) : null;

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight mb-4">XP Table</h2>

      {/* Selected level detail card */}
      {selectedRow ? (
        <div className="mb-5 rounded-xl border border-border/40 bg-bg-secondary/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-bold tabular-nums ${
                selectedRow.level === 99 ? "text-success" : selectedRow.level > 99 ? "text-accent" : "text-text-primary"
              }`}>
                {selectedRow.level}
              </div>
              <div>
                {selectedRow.level === 99 && <span className="text-xs text-success bg-success/10 px-1.5 py-0.5 rounded">MAX</span>}
                {selectedRow.level > 99 && <span className="text-xs text-accent bg-accent/10 px-1.5 py-0.5 rounded">VIRTUAL</span>}
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-text-secondary/40 hover:text-text-primary transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-secondary/50">Total XP</div>
              <div className="text-sm font-bold tabular-nums mt-0.5">{selectedRow.xp.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-secondary/50">XP to Next</div>
              <div className="text-sm font-bold tabular-nums mt-0.5 text-accent">
                {nextRow ? `+${(nextRow.xp - selectedRow.xp).toLocaleString()}` : "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-secondary/50">XP from Prev</div>
              <div className="text-sm font-bold tabular-nums mt-0.5 text-text-secondary">
                {prevRow ? `+${(selectedRow.xp - prevRow.xp).toLocaleString()}` : "—"}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-text-secondary/50 mb-4">Click a level to see XP details</p>
      )}

      {/* Level grid — 10 columns */}
      <div className="section-kicker mb-2">Levels 1–99</div>
      <div className="grid grid-cols-10 gap-1 mb-5">
        {XP_TABLE_VIRTUAL.slice(0, 99).map(({ level }) => {
          const isMilestone = level % 10 === 0;
          const isSelected = selected === level;
          return (
            <button
              key={level}
              onClick={() => setSelected(isSelected ? null : level)}
              className={`py-2 rounded text-xs font-medium tabular-nums transition-all ${
                isSelected
                  ? "bg-accent text-white scale-110 shadow-lg shadow-accent/20"
                  : level === 99
                    ? "bg-success/15 text-success hover:bg-success/25"
                    : isMilestone
                      ? "bg-accent/10 text-accent hover:bg-accent/20"
                      : "bg-bg-secondary/50 text-text-secondary hover:bg-bg-secondary"
              }`}
            >
              {level}
            </button>
          );
        })}
      </div>

      <div className="text-xs text-text-secondary/40 mb-4">
        Max XP per skill: <span className="text-text-primary font-medium tabular-nums">{MAX_XP.toLocaleString()}</span> (200M)
      </div>

      {/* Virtual levels */}
      <div className="section-kicker mb-2">Virtual Levels 100–126</div>
      <div className="grid grid-cols-9 gap-1">
        {XP_TABLE_VIRTUAL.slice(99).map(({ level }) => {
          const isSelected = selected === level;
          return (
            <button
              key={level}
              onClick={() => setSelected(isSelected ? null : level)}
              className={`py-2 rounded text-xs font-medium tabular-nums transition-all ${
                isSelected
                  ? "bg-accent text-white scale-110 shadow-lg shadow-accent/20"
                  : "bg-accent/8 text-accent/70 hover:bg-accent/15"
              }`}
            >
              {level}
            </button>
          );
        })}
      </div>
    </div>
  );
}
