import { useState, useMemo, useEffect } from "react";
import { useGEData } from "../../../hooks/useGEData";
import { formatGp } from "../../../lib/format";
import { itemIcon } from "../../../lib/sprites";
import type { RaidUnique } from "../data/cox";

interface RaidLootCalcProps {
  uniques: RaidUnique[];
  raidName: string;
  inputLabel: string;
  inputDefault: number;
  inputDescription: string;
  calculateRate: (inputValue: number) => number;
}

export default function RaidLootCalc({
  uniques,
  raidName,
  inputLabel,
  inputDefault,
  inputDescription,
  calculateRate,
}: RaidLootCalcProps) {
  const [inputValue, setInputValue] = useState(inputDefault);
  const { mapping, prices, fetchIfNeeded } = useGEData();

  useEffect(() => { fetchIfNeeded(); }, [fetchIfNeeded]);

  const itemMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of mapping) map.set(item.name.toLowerCase(), item.id);
    return map;
  }, [mapping]);

  const dropRate = calculateRate(inputValue);

  const rows = useMemo(() => {
    return uniques
      .filter((u) => u.pointsRequired !== "N/A")
      .map((item) => {
        const id = itemMap.get(item.name.toLowerCase());
        const price = id ? prices[String(id)] : null;
        const gePrice = price?.high ?? price?.low ?? null;
        const evPerRaid = gePrice != null && dropRate > 0
          ? gePrice / dropRate
          : null;

        return { item, gePrice, evPerRaid };
      });
  }, [uniques, prices, itemMap, dropRate]);

  const totalEvPerRaid = rows.reduce((sum, r) => sum + (r.evPerRaid ?? 0), 0);
  const petItem = uniques.find((u) => u.pointsRequired === "N/A");

  return (
    <div className="mt-4">
      <div className="section-kicker mb-3">Loot Calculator</div>

      <div className="flex items-center gap-3 mb-4">
        <label className="text-xs text-text-secondary">{inputLabel}:</label>
        <input
          type="number"
          min={1}
          max={10000}
          value={inputValue}
          onChange={(e) => setInputValue(Math.max(1, Number(e.target.value)))}
          className="w-24 bg-bg-tertiary border border-border rounded px-2 py-1 text-sm tabular-nums"
        />
        <span className="text-[10px] text-text-secondary/50">{inputDescription}</span>
      </div>

      <div className="bg-bg-secondary/30 rounded-lg px-4 py-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-text-secondary">Expected value per {raidName}</div>
            <div className="text-2xl font-bold text-success tabular-nums">
              {formatGp(Math.round(totalEvPerRaid))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-text-secondary">Unique rate</div>
            <div className="text-sm font-medium tabular-nums">
              1/{dropRate.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border text-text-secondary text-xs">
            <th className="px-2 py-1.5 text-left w-6" />
            <th className="px-2 py-1.5 text-left">Item</th>
            <th className="px-2 py-1.5 text-right">GE Price</th>
            <th className="px-2 py-1.5 text-right">EV/Raid</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.item.name}
              className="border-b border-border/20 hover:bg-bg-secondary/30 transition-colors"
            >
              <td className="px-2 py-1.5">
                <img
                  src={itemIcon(r.item.name)}
                  alt=""
                  className="w-5 h-5"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              </td>
              <td className="px-2 py-1.5 text-sm">{r.item.name}</td>
              <td className="px-2 py-1.5 text-xs text-right tabular-nums text-text-secondary">
                {r.gePrice != null ? formatGp(r.gePrice) : "—"}
              </td>
              <td className="px-2 py-1.5 text-xs text-right tabular-nums text-success">
                {r.evPerRaid != null ? formatGp(Math.round(r.evPerRaid)) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border font-medium">
            <td colSpan={3} className="px-2 py-2 text-xs">Total EV per raid</td>
            <td className="px-2 py-2 text-xs text-right tabular-nums text-success">
              {formatGp(Math.round(totalEvPerRaid))}
            </td>
          </tr>
        </tfoot>
      </table>

      {petItem && (
        <div className="mt-2 text-xs text-text-secondary/50">
          Pet ({petItem.name}): {petItem.rateDescription}
        </div>
      )}
    </div>
  );
}
