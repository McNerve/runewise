import { useState } from "react";
import { XP_TABLE } from "../../lib/formulas/xp";
import EmptyState from "../../components/EmptyState";

export default function XpTable() {
  const [search, setSearch] = useState("");

  const filtered = search
    ? XP_TABLE.filter(
        (row) =>
          String(row.level) === search ||
          String(row.xp).includes(search.replace(/,/g, ""))
      )
    : XP_TABLE;

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-semibold mb-4">XP Table</h2>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by level or XP..."
        className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2 text-sm mb-4"
      />

      <div className="section-kicker mb-2">
        Levels 1–99 {search && `(${filtered.length} results)`}
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
                <th className="text-left px-4 py-2">Level</th>
                <th className="text-right px-4 py-2">Total XP</th>
                <th className="text-right px-4 py-2">XP to Next</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ level, xp, diff }) => {
                const isMilestone = level % 10 === 0;
                return (
                  <tr
                    key={level}
                    className={`border-b border-border/50 hover:bg-bg-tertiary transition-colors ${
                      isMilestone ? "milestone-row" : "even:bg-bg-primary/30"
                    }`}
                  >
                    <td className={`px-4 py-1.5 font-medium ${isMilestone ? "text-accent" : ""}`}>
                      {level}
                    </td>
                    <td className="px-4 py-1.5 text-right">
                      {xp.toLocaleString()}
                    </td>
                    <td className="px-4 py-1.5 text-right text-text-secondary">
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
