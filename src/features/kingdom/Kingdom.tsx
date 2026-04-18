import { useState, useEffect, useMemo, useCallback } from "react";
import type { ItemPrice } from "../../lib/api/ge";
import { useGEData } from "../../hooks/useGEData";
import { formatGp } from "../../lib/format";
import { itemIcon } from "../../lib/sprites";
import { weightedHerbPrice } from "../../lib/data/kingdom";

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
  { name: "Fish (raw)", outputPer10: 583, itemId: 377, itemName: "Raw swordfish" },
  { name: "Hardwood", outputPer10: 168, itemId: 8780, itemName: "Teak plank" },
  { name: "Flax", outputPer10: 1150, itemId: 1779, itemName: "Flax" },
  { name: "Mining (gems)", outputPer10: 100, itemId: 1623, itemName: "Uncut sapphire" },
];

const DAILY_UPKEEP = 75_000;
const MAX_WORKERS = 10;

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
  const { prices, loading, fetchIfNeeded } = useGEData();
  const [resources, setResources] = useState<Resource[]>(
    DEFAULT_RESOURCES.map((r) => ({ ...r, workers: 0 })),
  );

  useEffect(() => { fetchIfNeeded(); }, [fetchIfNeeded]);

  const [isOptimal, setIsOptimal] = useState(false);
  const totalWorkers = resources.reduce((sum, r) => sum + r.workers, 0);
  const remaining = MAX_WORKERS - totalWorkers;

  const setWorkers = useCallback((index: number, value: number) => {
    setResources((prev) => {
      const next = [...prev];
      const current = next[index]!;
      const otherTotal = prev.reduce((s, r, i) => s + (i === index ? 0 : r.workers), 0);
      const clamped = Math.min(Math.max(0, value), MAX_WORKERS - otherTotal);
      next[index] = { ...current, workers: clamped };
      return next;
    });
    setIsOptimal(false);
  }, []);

  const rows = useMemo(() => {
    return resources.map((r) => {
      const price = getPrice(r.name, r.itemId, prices);
      const dailyOutput = Math.floor(r.outputPer10 * (r.workers / MAX_WORKERS));
      const dailyGp = price != null ? dailyOutput * price : null;
      return { ...r, price, dailyOutput, dailyGp };
    });
  }, [resources, prices]);

  const totalDailyGp = rows.reduce((sum, r) => {
    if (r.dailyGp == null) return sum;
    return sum + r.dailyGp;
  }, 0);

  const netProfit = totalDailyGp - DAILY_UPKEEP;

  const optimize = useCallback(() => {
    const gpPerWorker = DEFAULT_RESOURCES.map((r) => {
      const price = getPrice(r.name, r.itemId, prices);
      if (price == null) return 0;
      return (r.outputPer10 / MAX_WORKERS) * price;
    });

    // Rank resources by GP per worker
    const sorted = gpPerWorker
      .map((gp, i) => ({ gp, index: i }))
      .sort((a, b) => b.gp - a.gp);

    // OSRS Kingdom: max 10 workers, distribute across top resources
    // Best strategy is typically all 10 on rank 1, but if rank 2 is close
    // the community recommends a 5/5 or 7/3 split. We do greedy fill:
    // each resource gets workers proportional to its GP value
    const optimal = DEFAULT_RESOURCES.map((r) => ({ ...r, workers: 0 }));
    const totalGp = sorted.reduce((s, x) => s + Math.max(0, x.gp), 0);

    if (totalGp > 0) {
      let budget = MAX_WORKERS;
      // Give at least 5 to the best, then distribute rest proportionally
      const bestIdx = sorted[0]?.index;
      if (bestIdx != null) {
        const bestShare = Math.min(budget, Math.max(5, Math.round((sorted[0].gp / totalGp) * MAX_WORKERS)));
        optimal[bestIdx]!.workers = bestShare;
        budget -= bestShare;
      }
      // Fill remaining from 2nd best onwards
      for (let i = 1; i < sorted.length && budget > 0; i++) {
        const { index, gp } = sorted[i];
        if (gp <= 0) continue;
        const share = Math.min(budget, Math.max(1, Math.round((gp / totalGp) * MAX_WORKERS)));
        optimal[index]!.workers = share;
        budget -= share;
      }
      // If any budget remains, add to best
      if (budget > 0 && bestIdx != null) {
        optimal[bestIdx]!.workers += budget;
      }
    }

    setResources(optimal);
    setIsOptimal(true);
  }, [prices]);

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
        Allocate 10 workers across resources to maximize daily profit from Managing Miscellania
      </p>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={optimize}
          aria-pressed={isOptimal}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            isOptimal ? "bg-accent text-on-accent" : "bg-bg-tertiary text-text-secondary hover:bg-bg-secondary"
          }`}
        >
          Optimal
        </button>
        <button
          onClick={resetAll}
          className="px-3 py-1.5 rounded text-xs font-medium bg-bg-tertiary text-text-secondary hover:bg-bg-secondary transition-colors"
        >
          Reset
        </button>
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
              max={MAX_WORKERS}
              value={row.workers}
              onChange={(e) => setWorkers(i, Number(e.target.value))}
              className="flex-1"
            />
            <input
              type="number"
              min={0}
              max={MAX_WORKERS - (totalWorkers - row.workers)}
              value={row.workers}
              onChange={(e) => setWorkers(i, Number(e.target.value) || 0)}
              className="w-12 bg-bg-tertiary border border-border rounded px-1.5 py-0.5 text-xs text-center tabular-nums"
            />

            <span className="text-xs text-text-secondary tabular-nums w-14 text-right">
              {row.dailyOutput.toLocaleString()}
            </span>
            <span className="text-xs text-text-secondary tabular-nums w-10 text-right">
              {row.price != null ? formatGp(row.price) : "\u2014"}
            </span>
            <span className="text-sm font-medium tabular-nums w-16 text-right">
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
          <div className="text-sm font-semibold tabular-nums mt-0.5">
            {formatGp(Math.round(totalDailyGp))}
          </div>
        </div>
        <div className="bg-bg-tertiary rounded-lg px-3 py-2">
          <div className="text-[11px] text-text-secondary uppercase tracking-wider">
            Coffer Upkeep
          </div>
          <div className="text-sm font-semibold tabular-nums mt-0.5 text-danger">
            -{formatGp(DAILY_UPKEEP)}
          </div>
          <div className="text-[10px] text-text-secondary/50 mt-0.5 leading-tight">
            Daily coffer cost at 10 workers
          </div>
        </div>
        <div className="bg-bg-tertiary rounded-lg px-3 py-2">
          <div className="text-[11px] text-text-secondary uppercase tracking-wider">
            Net Profit
          </div>
          <div className={`text-sm font-semibold tabular-nums mt-0.5 ${netProfit >= 0 ? "text-success" : "text-danger"}`}>
            {netProfit >= 0 ? "" : "-"}{formatGp(Math.round(Math.abs(netProfit)))}
          </div>
        </div>
      </div>
    </div>
  );
}
