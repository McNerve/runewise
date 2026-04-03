import { useState, useMemo } from "react";
import { XP_TABLE_VIRTUAL } from "../../lib/formulas/xp";
import EmptyState from "../../components/EmptyState";

type Range = "all" | "1-30" | "31-60" | "61-90" | "91-99" | "virtual";

const RANGES: { id: Range; label: string; min: number; max: number }[] = [
  { id: "all", label: "All", min: 1, max: 126 },
  { id: "1-30", label: "1–30", min: 1, max: 30 },
  { id: "31-60", label: "31–60", min: 31, max: 60 },
  { id: "61-90", label: "61–90", min: 61, max: 90 },
  { id: "91-99", label: "91–99", min: 91, max: 99 },
  { id: "virtual", label: "100–126", min: 100, max: 126 },
];

export default function XpTable() {
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<Range>("all");

  const activeRange = RANGES.find((r) => r.id === range) ?? RANGES[0];

  const filtered = useMemo(() => {
    let rows = XP_TABLE_VIRTUAL.filter(
      (row) => row.level >= activeRange.min && row.level <= activeRange.max
    );
    if (search) {
      rows = rows.filter(
        (row) =>
          String(row.level) === search ||
          String(row.xp).includes(search.replace(/,/g, ""))
      );
    }
    return rows;
  }, [search, activeRange]);

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-semibold mb-4">XP Table</h2>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by level or XP..."
        aria-label="Search by level or XP"
        className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2 text-sm mb-3"
      />

      <div className="flex gap-1 mb-4">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            aria-pressed={range === r.id}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              range === r.id
                ? "bg-accent text-white"
                : "text-text-secondary hover:bg-bg-secondary"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="section-kicker mb-2">
        {activeRange.id === "all" ? "Levels 1–126" : `Levels ${activeRange.min}–${activeRange.max}`}
        {activeRange.id === "virtual" && " (Virtual)"}
        {search && ` (${filtered.length} results)`}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No levels found"
          description={`No levels match "${search}"`}
        />
      ) : (
        <div className="bg-bg-secondary rounded-lg overflow-hidden max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-bg-secondary">
              <tr className="border-b border-border text-text-secondary text-xs">
                <th scope="col" className="text-left px-4 py-2">Level</th>
                <th scope="col" className="text-right px-4 py-2">Total XP</th>
                <th scope="col" className="text-right px-4 py-2">XP to Next</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ level, xp, diff }) => {
                const isMilestone = level % 10 === 0;
                const isMax = level === 99;
                const isVirtual = level > 99;
                return (
                  <tr
                    key={level}
                    className={`border-b border-border/50 hover:bg-bg-tertiary transition-colors ${
                      isMax ? "bg-success/8" : isVirtual ? "bg-accent/5" : isMilestone ? "milestone-row" : "even:bg-bg-primary/30"
                    }`}
                  >
                    <td className={`px-4 py-1.5 font-medium ${
                      isMax ? "text-success" : isVirtual ? "text-accent" : isMilestone ? "text-accent" : ""
                    }`}>
                      {level}
                      {isMax && <span className="ml-1.5 text-[9px] text-success/60">MAX</span>}
                      {isVirtual && <span className="ml-1.5 text-[9px] text-accent/50">VIRTUAL</span>}
                    </td>
                    <td className="px-4 py-1.5 text-right tabular-nums">
                      {xp.toLocaleString()}
                    </td>
                    <td className="px-4 py-1.5 text-right text-text-secondary tabular-nums">
                      {diff > 0 ? `+${diff.toLocaleString()}` : "\u2014"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
