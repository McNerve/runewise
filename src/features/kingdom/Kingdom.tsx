import { useState, useEffect, useMemo, useCallback } from "react";
import type { ItemPrice } from "../../lib/api/ge";
import { useGEData } from "../../hooks/useGEData";
import { formatGp } from "../../lib/format";
import { itemIcon } from "../../lib/sprites";
import { weightedHerbPrice } from "../../lib/data/kingdom";
import ErrorState from "../../components/ErrorState";

interface Resource {
  name: string;
  outputPer10: number;
  itemId: number;
  itemName: string;
  workers: number;
}

const DEFAULT_RESOURCES: Omit<Resource, "workers">[] = [
  { name: "Herbs", outputPer10: 46, itemId: 207, itemName: "Grimy ranarr weed" },
  { name: "Coal", outputPer10: 458, itemId: 453, itemName: "Coal" },
  { name: "Maple logs", outputPer10: 892, itemId: 1517, itemName: "Maple logs" },
  { name: "Fish (raw)", outputPer10: 583, itemId: 371, itemName: "Raw swordfish" },
  { name: "Hardwood", outputPer10: 168, itemId: 6333, itemName: "Teak logs" },
  { name: "Flax", outputPer10: 1150, itemId: 1779, itemName: "Flax" },
  { name: "Mining (gems)", outputPer10: 100, itemId: 1623, itemName: "Uncut sapphire" },
];

// outputPer10 is calibrated per 10 workers at 100% approval.
const WORKER_BASIS = 10;
// At most 10 workers can be assigned to a single resource.
const PER_RESOURCE_CAP = 10;
// Royal Trouble raises the workforce from 10 to 15 and the max daily coffer
// withdrawal from 50k to 75k.
const POST_RT = { workers: 15, upkeep: 75_000 };
const PRE_RT = { workers: 10, upkeep: 50_000 };

function getPrice(
  name: string,
  itemId: number,
  prices: Record<string, ItemPrice>,
): number | null {
  if (name === "Herbs") return weightedHerbPrice(prices);
  const p = prices[String(itemId)];
  return p?.high ?? p?.low ?? null;
}

export default function Kingdom() {
  const { prices, loading, error, pricesLoaded, fetchIfNeeded } = useGEData();
  const [resources, setResources] = useState<Resource[]>(
    DEFAULT_RESOURCES.map((r) => ({ ...r, workers: 0 })),
  );
  const [royalTrouble, setRoyalTrouble] = useState(true);
  const [approval, setApproval] = useState(100);

  useEffect(() => { fetchIfNeeded(); }, [fetchIfNeeded]);

  const { workers: maxWorkers, upkeep: dailyUpkeep } = royalTrouble ? POST_RT : PRE_RT;

  const [isOptimal, setIsOptimal] = useState(false);
  const totalWorkers = resources.reduce((sum, r) => sum + r.workers, 0);
  const remaining = maxWorkers - totalWorkers;

  const setWorkers = useCallback((index: number, value: number) => {
    setResources((prev) => {
      const next = [...prev];
      const current = next[index]!;
      const otherTotal = prev.reduce((s, r, i) => s + (i === index ? 0 : r.workers), 0);
      const clamped = Math.min(Math.max(0, value), PER_RESOURCE_CAP, maxWorkers - otherTotal);
      next[index] = { ...current, workers: clamped };
      return next;
    });
    setIsOptimal(false);
  }, [maxWorkers]);

  const toggleRoyalTrouble = useCallback(() => {
    const next = !royalTrouble;
    // Shrinking the workforce: trim allocations to fit the new budget.
    let budget = (next ? POST_RT : PRE_RT).workers;
    const trimmed = resources.map((r) => {
      const w = Math.min(r.workers, PER_RESOURCE_CAP, budget);
      budget -= w;
      return { ...r, workers: w };
    });
    setRoyalTrouble(next);
    setResources(trimmed);
    setIsOptimal(false);
  }, [royalTrouble, resources]);

  const rows = useMemo(() => {
    return resources.map((r) => {
      const price = getPrice(r.name, r.itemId, prices);
      const dailyOutput = Math.floor(
        r.outputPer10 * (r.workers / WORKER_BASIS) * (approval / 100),
      );
      const dailyGp = price != null ? dailyOutput * price : null;
      return { ...r, price, dailyOutput, dailyGp };
    });
  }, [resources, prices, approval]);

  const totalDailyGp = rows.reduce((sum, r) => {
    if (r.dailyGp == null) return sum;
    return sum + r.dailyGp;
  }, 0);

  // Workers allocated to resources without a GE price → incomplete income.
  // Don't present gross=0 − upkeep as a definitive large loss.
  const allocatedMissingPrices = rows.some(
    (r) => r.workers > 0 && r.price == null,
  );
  const pricesUnavailable =
    Boolean(error) ||
    (totalWorkers > 0 && allocatedMissingPrices) ||
    (totalWorkers > 0 && !pricesLoaded && Object.keys(prices).length === 0);

  const netProfit = pricesUnavailable ? null : totalDailyGp - dailyUpkeep;

  const optimize = useCallback(() => {
    // Output is linear in workers, so the optimum is a greedy fill: best
    // GP-per-worker resource first, capped at 10 workers per resource.
    const ranked = DEFAULT_RESOURCES.map((r, index) => {
      const price = getPrice(r.name, r.itemId, prices);
      return { index, gp: price != null ? (r.outputPer10 / WORKER_BASIS) * price : 0 };
    }).sort((a, b) => b.gp - a.gp);

    const optimal = DEFAULT_RESOURCES.map((r) => ({ ...r, workers: 0 }));
    let budget = maxWorkers;
    for (const { index, gp } of ranked) {
      if (budget <= 0 || gp <= 0) break;
      const take = Math.min(PER_RESOURCE_CAP, budget);
      optimal[index]!.workers = take;
      budget -= take;
    }

    setResources(optimal);
    setIsOptimal(true);
  }, [prices, maxWorkers]);

  const resetAll = useCallback(() => {
    setResources(DEFAULT_RESOURCES.map((r) => ({ ...r, workers: 0 })));
    setIsOptimal(false);
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl">
        <h2 className="text-xl font-semibold mb-1">Kingdom Calculator</h2>
        <div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-3/4" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-1">Kingdom Calculator</h2>
      <p className="text-xs text-text-secondary mb-4">
        Allocate {maxWorkers} workers across resources to maximize daily profit from Managing Miscellania
      </p>

      {error && !pricesLoaded && (
        <div className="mb-4">
          <ErrorState
            title="Couldn't load GE prices"
            error={error}
            onRetry={() => { void fetchIfNeeded(); }}
          />
        </div>
      )}

      {pricesUnavailable && (pricesLoaded || Object.keys(prices).length > 0 || totalWorkers > 0) && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning"
        >
          {error
            ? `GE prices unavailable (${error}). Net profit is not shown until prices load.`
            : "GE prices missing for one or more allocated resources. Net profit is incomplete and hidden until prices are available."}
          {error && (
            <button
              type="button"
              onClick={() => { void fetchIfNeeded(); }}
              className="ml-2 underline hover:no-underline"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button
          onClick={optimize}
          aria-pressed={isOptimal}
          title="Auto-allocate workers for max GP/day"
          className={`home-tile px-3 py-1.5 rounded text-xs font-medium border ${
            isOptimal ? "bg-accent text-on-accent border-accent" : "bg-bg-tertiary text-text-secondary border-transparent"
          }`}
        >
          Optimal
        </button>
        <button
          onClick={resetAll}
          title="Clear all worker allocations"
          className="home-tile px-3 py-1.5 rounded text-xs font-medium bg-bg-tertiary text-text-secondary border border-transparent"
        >
          Reset
        </button>
        <button
          onClick={toggleRoyalTrouble}
          aria-pressed={royalTrouble}
          title="Royal Trouble unlocks 15 workers and raises max daily upkeep to 75k"
          className={`home-tile px-3 py-1.5 rounded text-xs font-medium border ${
            royalTrouble ? "bg-accent text-on-accent border-accent" : "bg-bg-tertiary text-text-secondary border-transparent"
          }`}
        >
          Royal Trouble
        </button>
        <label className="flex items-center gap-2 text-xs text-text-secondary">
          Approval
          <input
            type="number"
            min={0}
            max={100}
            value={approval}
            onChange={(e) => setApproval(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
            className="w-14 px-1.5 py-1 rounded-lg bg-bg-tertiary border border-border text-xs text-center num focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-colors"
          />
          %
        </label>
        <span className={`text-xs tabular-nums ml-auto ${remaining < 0 ? "text-danger" : "text-text-secondary"}`}>
          {remaining} worker{remaining !== 1 ? "s" : ""} remaining
        </span>
      </div>

      {/* Column labels */}
      <div className="section-kicker mb-2">Worker Allocation</div>
      <div className="flex items-center gap-3 px-2 mb-1 text-[10px] text-text-secondary/50 uppercase tracking-wider">
        <span className="w-5 shrink-0" />
        <span className="w-28 shrink-0">Resource</span>
        <span className="flex-1" />
        <span className="w-12 text-center">Qty</span>
        <span className="w-14 text-right">Output</span>
        <span className="w-10 text-right">Price</span>
        <span className="w-16 text-right">GP/day</span>
      </div>

      {/* Resource rows */}
      <div className="space-y-1 mb-6">
        {rows.map((row, i) => (
          <div
            key={row.name}
            className="flex items-center gap-3 py-2 px-2 rounded hover:bg-bg-secondary transition-colors"
          >
            <img
              src={itemIcon(row.itemName)}
              alt=""
              className="w-5 h-5 shrink-0"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <span className="text-sm w-28 shrink-0">{row.name}</span>

            <input
              type="range"
              min={0}
              max={PER_RESOURCE_CAP}
              value={row.workers}
              onChange={(e) => setWorkers(i, Number(e.target.value))}
              className="flex-1"
            />
            <input
              type="number"
              min={0}
              max={Math.min(PER_RESOURCE_CAP, maxWorkers - (totalWorkers - row.workers))}
              value={row.workers}
              onChange={(e) => setWorkers(i, Number(e.target.value) || 0)}
              className="w-12 px-1.5 py-1 rounded-lg bg-bg-tertiary border border-border text-xs text-center num focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-colors"
            />

            <span className="text-xs text-text-secondary num w-14 text-right">
              {row.dailyOutput.toLocaleString()}
            </span>
            <span className="text-xs text-text-secondary num w-10 text-right">
              {row.price != null ? formatGp(row.price) : "\u2014"}
            </span>
            <span className="text-sm font-medium num w-16 text-right">
              {row.dailyGp != null ? formatGp(row.dailyGp) : "\u2014"}
            </span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="section-kicker mb-2">Daily Summary</div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bg-tertiary rounded-lg px-3 py-2">
          <div className="text-[11px] text-text-secondary uppercase tracking-wider">
            Gross Income
          </div>
          <div className="text-sm font-semibold num mt-0.5">
            {pricesUnavailable && totalWorkers > 0
              ? "\u2014"
              : formatGp(Math.round(totalDailyGp))}
          </div>
        </div>
        <div className="bg-bg-tertiary rounded-lg px-3 py-2">
          <div className="text-[11px] text-text-secondary uppercase tracking-wider">
            Coffer Upkeep
          </div>
          <div className="text-sm font-semibold num mt-0.5 text-danger">
            -{formatGp(dailyUpkeep)}
          </div>
          <div className="text-[10px] text-text-secondary/50 mt-0.5 leading-tight">
            Max daily coffer withdrawal ({royalTrouble ? "post" : "pre"}-Royal Trouble)
          </div>
        </div>
        <div className="bg-bg-tertiary rounded-lg px-3 py-2">
          <div className="text-[11px] text-text-secondary uppercase tracking-wider">
            Net Profit
          </div>
          <div
            className={`text-sm font-semibold num mt-0.5 ${
              netProfit == null
                ? "text-text-secondary"
                : netProfit >= 0
                  ? "text-success"
                  : "text-danger"
            }`}
          >
            {netProfit == null
              ? "\u2014"
              : `${netProfit >= 0 ? "" : "-"}${formatGp(Math.round(Math.abs(netProfit)))}`}
          </div>
        </div>
      </div>
    </div>
  );
}
