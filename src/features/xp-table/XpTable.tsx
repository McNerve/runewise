import { useState } from "react";
import { XP_TABLE, XP_TABLE_VIRTUAL } from "../../lib/formulas/xp";
import EmptyState from "../../components/EmptyState";

export default function XpTable() {
  const [search, setSearch] = useState("");
  const [showVirtual, setShowVirtual] = useState(false);

  const source = showVirtual ? XP_TABLE_VIRTUAL : XP_TABLE;
  const filtered = search
    ? source.filter(
        (row) =>
          String(row.level) === search ||
          String(row.xp).includes(search.replace(/,/g, ""))
      )
    : source;

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-semibold mb-4">XP Table</h2>

      <div className="flex gap-3 items-center mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by level or XP..."
          aria-label="Search by level or XP"
          className="flex-1 bg-bg-secondary border border-border rounded-lg px-4 py-2 text-sm"
        />
        <button
          onClick={() => setShowVirtual(!showVirtual)}
          aria-pressed={showVirtual}
          className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            showVirtual
              ? "bg-accent text-white"
              : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
          }`}
        >
          Virtual Levels
        </button>
      </div>

      <div className="section-kicker mb-2">
        Levels 1–{showVirtual ? "126" : "99"} {search && `(${filtered.length} results)`}
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
