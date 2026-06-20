import { useState, useMemo, useEffect } from "react";
import type { ItemMapping, ItemPrice } from "../../../lib/api/ge";
import { fetchVolumes } from "../../../lib/api/ge";
import { formatGp, timeAgo } from "../../../lib/format";
import { itemIcon } from "../../../lib/sprites";
import ItemTooltip from "../../../components/ItemTooltip";
import { findFlips, type FlipSort } from "../flipFinder";

interface FlipFinderProps {
  mapping: ItemMapping[];
  prices: Record<string, ItemPrice>;
}

const SORTS: { key: FlipSort; label: string }[] = [
  { key: "perLimit", label: "Profit / limit" },
  { key: "margin", label: "Margin" },
  { key: "roi", label: "ROI %" },
  { key: "volume", label: "Volume" },
];

const RESULT_CAP = 80;

function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  placeholder: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-2xs uppercase tracking-[0.12em] text-text-tertiary">{label}</span>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
        className="w-28 rounded-lg border border-border-subtle bg-bg-tertiary px-2.5 py-1.5 text-sm num text-text-primary focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-colors"
      />
    </label>
  );
}

export default function FlipFinder({ mapping, prices }: FlipFinderProps) {
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [volLoaded, setVolLoaded] = useState(false);
  const [budget, setBudget] = useState<number | "">("");
  const [minMargin, setMinMargin] = useState<number | "">("");
  const [minVolume, setMinVolume] = useState<number | "">(100);
  const [members, setMembers] = useState<"all" | "f2p" | "p2p">("all");
  const [sort, setSort] = useState<FlipSort>("perLimit");

  useEffect(() => {
    let cancelled = false;
    fetchVolumes()
      .then((v) => {
        if (!cancelled) {
          setVolumes(v);
          setVolLoaded(true);
        }
      })
      .catch(() => !cancelled && setVolLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const flips = useMemo(
    () =>
      findFlips(mapping, prices, volumes, {
        budget: typeof budget === "number" ? budget : undefined,
        minMargin: typeof minMargin === "number" ? minMargin : undefined,
        minVolume: typeof minVolume === "number" ? minVolume : undefined,
        members,
        sort,
        limit: RESULT_CAP,
      }),
    [mapping, prices, volumes, budget, minMargin, minVolume, members, sort]
  );

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-3">
        <NumberField label="Budget (max buy)" value={budget} onChange={setBudget} placeholder="any" />
        <NumberField label="Min margin" value={minMargin} onChange={setMinMargin} placeholder="0" />
        <NumberField label="Min volume / day" value={minVolume} onChange={setMinVolume} placeholder="0" />
        <label className="flex flex-col gap-1">
          <span className="text-2xs uppercase tracking-[0.12em] text-text-tertiary">Members</span>
          <div className="flex rounded-lg border border-border-subtle overflow-hidden">
            {(["all", "f2p", "p2p"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMembers(m)}
                aria-pressed={members === m}
                className={`px-2.5 py-1.5 text-xs uppercase transition-colors ${
                  members === m
                    ? "bg-accent/15 text-accent"
                    : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </label>
        <label className="flex flex-col gap-1 ml-auto">
          <span className="text-2xs uppercase tracking-[0.12em] text-text-tertiary">Sort by</span>
          <div className="flex gap-1" role="group" aria-label="Sort flips">
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                aria-pressed={sort === s.key}
                className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors border ${
                  sort === s.key
                    ? "bg-accent/15 border-accent/40 text-accent"
                    : "bg-bg-tertiary border-border-subtle text-text-secondary hover:text-text-primary"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </label>
      </div>

      {/* Honesty note — accuracy is the point */}
      <p className="text-2xs text-text-tertiary mb-3 leading-relaxed">
        Net margin already subtracts the 2% GE sell tax. Prices are OSRS Wiki real-time
        (completed RuneLite trades, ~5 min refresh) — low-volume items are easy to manipulate, so
        the volume filter defaults to 100/day. <span className="text-text-secondary">Profit / limit</span> is
        the most you can clear per 4-hour buy-limit cycle.
      </p>

      {!volLoaded ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-bg-tertiary/50 animate-pulse" />
          ))}
        </div>
      ) : flips.length === 0 ? (
        <div className="py-10 text-center text-sm text-text-secondary">
          No flips match these filters. Try lowering the minimum margin or volume.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border-subtle">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-2xs uppercase tracking-wider text-text-tertiary border-b border-border-subtle">
                <th className="text-left font-medium px-3 py-2">Item</th>
                <th className="text-right font-medium px-3 py-2">Buy</th>
                <th className="text-right font-medium px-3 py-2">Sell</th>
                <th className="text-right font-medium px-3 py-2">Margin</th>
                <th className="text-right font-medium px-3 py-2">ROI</th>
                <th className="text-right font-medium px-3 py-2 hidden sm:table-cell">Vol/day</th>
                <th className="text-right font-medium px-3 py-2 hidden md:table-cell">Limit</th>
                <th className="text-right font-medium px-3 py-2">Profit / limit</th>
              </tr>
            </thead>
            <tbody>
              {flips.map((f) => (
                <tr
                  key={f.item.id}
                  className="border-b border-border-subtle/50 last:border-0 hover:bg-bg-secondary/40 transition-colors"
                >
                  <td className="px-3 py-1.5">
                    <ItemTooltip itemName={f.item.name}>
                      <span className="flex items-center gap-2 cursor-default">
                        <img
                          src={itemIcon(f.item.name)}
                          alt=""
                          className="w-5 h-5 shrink-0"
                          onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = "hidden")}
                        />
                        <span className="truncate max-w-[10rem] text-text-primary">{f.item.name}</span>
                      </span>
                    </ItemTooltip>
                  </td>
                  <td className="px-3 py-1.5 text-right num text-text-secondary">{formatGp(f.buy)}</td>
                  <td className="px-3 py-1.5 text-right num text-text-secondary">{formatGp(f.sell)}</td>
                  <td className="px-3 py-1.5 text-right num text-success font-medium">{formatGp(f.margin)}</td>
                  <td className="px-3 py-1.5 text-right num text-text-secondary">{(f.roi * 100).toFixed(1)}%</td>
                  <td className="px-3 py-1.5 text-right num text-text-secondary hidden sm:table-cell">
                    {f.volume.toLocaleString()}
                  </td>
                  <td className="px-3 py-1.5 text-right num text-text-secondary hidden md:table-cell">
                    {f.limit > 0 ? f.limit.toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-1.5 text-right num text-accent font-medium">
                    {f.perLimit > 0 ? formatGp(f.perLimit) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {flips.length === RESULT_CAP && (
        <p className="text-2xs text-text-tertiary mt-2">
          Showing the top {RESULT_CAP}. Narrow the filters to see more specific flips.
        </p>
      )}
      {(() => {
        // Show the OLDEST timestamp across the rendered rows so the freshness
        // claim is honest for the most-stale flip shown, not just whichever
        // item happened to sort to the top.
        const oldest = flips.reduce(
          (m, f) => (f.updated != null ? Math.min(m, f.updated) : m),
          Infinity
        );
        return Number.isFinite(oldest) ? (
          <p className="text-2xs text-text-tertiary mt-2">Oldest price shown updated {timeAgo(oldest)}.</p>
        ) : null;
      })()}
    </div>
  );
}
