import { useState, useCallback } from "react";
import type { ComparisonTable as ComparisonTableData, ComparisonRow } from "../../../lib/wiki/tables";
import WikiImage from "../../../components/WikiImage";

interface Props {
  data: ComparisonTableData;
  /** If provided, link clicks are intercepted for in-app navigation */
  onLinkClick?: (href: string) => void;
}

type SortDir = "asc" | "desc" | null;

interface SortState {
  col: string;
  dir: SortDir;
}

export default function ComparisonTable({ data, onLinkClick }: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [sort, setSort] = useState<SortState>({ col: "", dir: null });

  const toggleRow = useCallback((index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  function handleSort(col: string) {
    setSort((prev) => {
      if (prev.col !== col) return { col, dir: "asc" };
      if (prev.dir === "asc") return { col, dir: "desc" };
      return { col: "", dir: null };
    });
  }

  const sortedRows: ComparisonRow[] = sort.dir
    ? [...data.rows].sort((a, b) => {
        const va = a.stats[sort.col] ?? "";
        const vb = b.stats[sort.col] ?? "";
        const na = typeof va === "number" ? va : parseFloat(String(va)) || 0;
        const nb = typeof vb === "number" ? vb : parseFloat(String(vb)) || 0;
        const diff = na - nb;
        return sort.dir === "asc" ? diff : -diff;
      })
    : data.rows;

  // Detect numeric stat columns so we can right-align them
  const numericCols = new Set(
    data.columns.filter((col) =>
      data.rows.some((row) => typeof row.stats[col] === "number")
    )
  );

  const hasNotes = data.rows.some((row) => row.notes.length > 0);

  return (
    <div className="comparison-table-wrapper overflow-x-auto rounded-xl border border-border/60">
      {data.caption ? (
        <div className="px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary/60 border-b border-border/40">
          {data.caption}
        </div>
      ) : null}

      <table className="comparison-table w-full text-sm" style={{ tableLayout: "fixed" }}>
        <thead>
          <tr>
            {/* Image column */}
            <th className="comparison-th w-14 px-2 py-3 text-center" aria-label="Item image" />

            {data.columns.map((col) => {
              const isNumeric = numericCols.has(col);
              const isSorted = sort.col === col;
              return (
                <th
                  key={col}
                  className={`comparison-th px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-text-secondary/70 cursor-pointer select-none transition-colors hover:text-text-primary ${
                    isNumeric ? "text-right" : ""
                  } ${isSorted ? "text-text-primary" : ""}`}
                  onClick={() => {
                    if (col !== data.columns[0]) handleSort(col);
                  }}
                  title={col !== data.columns[0] ? `Sort by ${col}` : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col}
                    {isSorted ? (
                      <span className="text-accent text-[10px]">
                        {sort.dir === "asc" ? "↑" : "↓"}
                      </span>
                    ) : col !== data.columns[0] ? (
                      <span className="text-text-secondary/30 text-[10px]">↕</span>
                    ) : null}
                  </span>
                </th>
              );
            })}

            {hasNotes ? (
              <th className="comparison-th px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-text-secondary/70">
                Notes
              </th>
            ) : null}
          </tr>
        </thead>

        <tbody>
          {sortedRows.map((row) => {
            const idx = data.rows.indexOf(row);
            const expanded = expandedRows.has(idx);

            return (
              <tr
                key={idx}
                className="comparison-row group border-t border-border/30 transition-colors hover:bg-bg-secondary/20"
              >
                {/* Image */}
                <td className="w-14 px-2 py-2.5 text-center">
                  {row.image ? (
                    <WikiImage
                      src={row.image}
                      alt={row.name}
                      className="mx-auto h-9 w-9 rounded-md bg-bg-primary/50 object-contain p-1"
                      fallback={row.name[0]}
                    />
                  ) : (
                    <span className="flex h-9 w-9 mx-auto items-center justify-center rounded-md bg-bg-primary/50 text-xs font-bold text-text-secondary/50">
                      {row.name[0]}
                    </span>
                  )}
                </td>

                {/* Stat cells */}
                {data.columns.map((col) => {
                  const value = row.stats[col] ?? "—";
                  const isNumeric = numericCols.has(col);
                  const isName = col === data.columns[0];

                  return (
                    <td
                      key={col}
                      className={`px-3 py-2.5 text-sm text-text-secondary ${
                        isNumeric ? "text-right tabular-nums" : ""
                      } ${isName ? "font-medium text-text-primary" : ""}`}
                    >
                      {isName && row.link ? (
                        <button
                          type="button"
                          className="text-accent hover:text-accent-hover underline underline-offset-2 decoration-1 text-left"
                          onClick={() => onLinkClick?.(row.link!)}
                        >
                          {row.name}
                        </button>
                      ) : (
                        String(value)
                      )}
                    </td>
                  );
                })}

                {/* Notes */}
                {hasNotes ? (
                  <td className="px-3 py-2.5 align-top">
                    {row.notes ? (
                      <div className="comparison-notes-cell">
                        {expanded ? (
                          <>
                            <div
                              className="text-xs leading-5 text-text-secondary [&_a]:text-accent [&_a]:underline"
                              dangerouslySetInnerHTML={{ __html: row.notes }}
                            />
                            <button
                              type="button"
                              onClick={() => toggleRow(idx)}
                              className="mt-1 text-[10px] uppercase tracking-wide text-text-secondary/50 hover:text-text-secondary transition-colors"
                            >
                              Collapse
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleRow(idx)}
                            className="group/notes text-left"
                            title="Expand notes"
                          >
                            <span
                              className="line-clamp-2 text-xs leading-5 text-text-secondary/60 group-hover/notes:text-text-secondary transition-colors"
                              dangerouslySetInnerHTML={{ __html: row.notes }}
                            />
                            <span className="mt-0.5 inline-block text-[10px] uppercase tracking-wide text-accent/60 group-hover/notes:text-accent transition-colors">
                              More
                            </span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-text-secondary/30 text-xs">—</span>
                    )}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
