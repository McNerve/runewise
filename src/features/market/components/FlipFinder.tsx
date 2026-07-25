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
  const [volError, setVolError] = useState(false);
  const [volRetry, setVolRetry] = useState(0);
  const [budget, setBudget] = useState<number | "">("");
  const [minMargin, setMinMargin] = useState<number | "">("");
  const [minVolume, setMinVolume] = useState<number | "">(100);
  const [members, setMembers] = useState<"all" | "f2p" | "p2p">("all");
  const [sort, setSort] = useState<FlipSort>("perLimit");

  useEffect(() => {
    let cancelled = false;
    setVolLoaded(false); // eslint-disable-line react-hooks/set-state-in-effect -- reset before async volume fetch
    setVolError(false);  
    fetchVolumes()
      .then((v) => {
        if (!cancelled) {
          setVolumes(v);
          setVolLoaded(true);
          setVolError(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVolumes({});
          setVolLoaded(true);
          setVolError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [volRetry]);

  const geReady = mapping.length > 0 && Object.keys(prices).length > 0;
  // When volumes failed, ignore the default min-volume filter so results still show.
  const effectiveMinVolume =
    volError ? 0 : typeof minVolume === "number" ? minVolume : undefined;

  const flips = useMemo(
    () =>
      !geReady
        ? []
        : findFlips(mapping, prices, volumes, {
            budget: typeof budget === "number" ? budget : undefined,
            minMargin: typeof minMargin === "number" ? minMargin : undefined,
            minVolume: effectiveMinVolume,
            members,
            sort,
            limit: RESULT_CAP,
          }),
    [mapping, prices, volumes, budget, minMargin, effectiveMinVolume, members, sort, geReady]
  );

  const topByLimit = useMemo(() => {
    if (flips.length === 0) return null;
    return flips.reduce((best, f) => (f.perLimit > best.perLimit ? f : best), flips[0]!);
  }, [flips]);

  const topMargin = useMemo(() => {
    if (flips.length === 0) return null;
    return flips.reduce((best, f) => (f.margin > best.margin ? f : best), flips[0]!);
  }, [flips]);

  const medianRoi = useMemo(() => {
    if (flips.length === 0) return null;
    const sorted = [...flips].map((f) => f.roi).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)] ?? null;
  }, [flips]);

  return (
    <div>
      {/* Hero verdict — marketing differentiator for flippers */}
      {volLoaded && flips.length > 0 && topByLimit && topMargin && medianRoi != null && (
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="rounded-xl border border-accent/25 bg-accent/8 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-[0.14em] text-accent/80">Best / limit</div>
            <div className="mt-0.5 text-lg font-semibold num text-accent">
              {formatGp(topByLimit.perLimit)}
            </div>
            <div className="text-xs text-text-secondary truncate" title={topByLimit.item.name}>
              {topByLimit.item.name}
            </div>
          </div>
          <div className="rounded-xl border border-border-subtle bg-bg-tertiary/60 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary">Top margin</div>
            <div className="mt-0.5 text-lg font-semibold num text-success">
              {formatGp(topMargin.margin)}
            </div>
            <div className="text-xs text-text-secondary truncate" title={topMargin.item.name}>
              {topMargin.item.name}
            </div>
          </div>
          <div className="rounded-xl border border-border-subtle bg-bg-tertiary/60 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary">Median ROI</div>
            <div className="mt-0.5 text-lg font-semibold num text-text-primary">
              {(medianRoi * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-text-secondary">
              {flips.length} tax-correct flips · after 2% sell tax
            </div>
          </div>
        </div>
      )}

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
        Net margin already subtracts the 2% GE sell tax. Buy (low) / Sell (high) are offer-side
        prices (opposite of Market Instabuy/Instasell). Prices are OSRS Wiki real-time
        (completed RuneLite trades, ~5 min refresh) — low-volume items are easy to manipulate, so
        the volume filter defaults to 100/day. <span className="text-text-secondary">Profit / limit</span> is
        the most you can clear per 4-hour buy-limit cycle.
      </p>
      {volError && volLoaded && (
        <div className="mb-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning flex items-center justify-between gap-2">
          <span>Volume data failed to load — min volume filter disabled until retry.</span>
          <button
            type="button"
            onClick={() => setVolRetry((n) => n + 1)}
            className="shrink-0 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {!volLoaded || !geReady ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-bg-tertiary/50 animate-pulse" />
          ))}
        </div>
      ) : volError && flips.length === 0 ? (
        <div className="py-10 text-center space-y-3">
          <p className="text-sm text-danger">Could not load trade volumes.</p>
          <p className="text-xs text-text-secondary">
            Without volume data the min-volume filter cannot run. Retry, or wait for GE prices.
          </p>
          <button
            type="button"
            onClick={() => setVolRetry((n) => n + 1)}
            className="px-3 py-1.5 rounded-lg text-xs bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-colors"
          >
            Retry volumes
          </button>
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
                <th className="text-right font-medium px-3 py-2" title="GE low — place buy offer near this">Buy (low)</th>
                <th className="text-right font-medium px-3 py-2" title="GE high — place sell offer near this">Sell (high)</th>
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
