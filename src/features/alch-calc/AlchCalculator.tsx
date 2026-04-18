import { useState, useEffect, useMemo } from "react";
import { itemIcon } from "../../lib/sprites";
import type { ItemMapping } from "../../lib/api/ge";
import { useGEData } from "../../hooks/useGEData";
import { formatGp } from "../../lib/format";
import ItemTooltip from "../../components/ItemTooltip";

type MembersFilter = "all" | "f2p" | "p2p";
type SortKey = "profit" | "roi" | "name" | "buyPrice" | "highalch" | "limit";
type SortDir = "asc" | "desc";

interface AlchRow {
  item: ItemMapping;
  buyPrice: number;
  highalch: number;
  profit: number;
  roi: number;
}

const PAGE_SIZE = 50;

export default function AlchCalculator() {
  const { mapping: items, prices, loading, fetchIfNeeded } = useGEData();
  const [error] = useState<string | null>(null);

  const [minProfit, setMinProfitRaw] = useState(0);
  const [membersFilter, setMembersFilterRaw] = useState<MembersFilter>("all");
  const [minBuyLimit, setMinBuyLimitRaw] = useState(0);
  const [sortKey, setSortKeyRaw] = useState<SortKey>("profit");
  const [sortDir, setSortDirRaw] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  // Reset pagination when filters/sort change
  const setMinProfit = (v: number) => { setMinProfitRaw(v); setPage(0); };
  const setMembersFilter = (v: MembersFilter) => { setMembersFilterRaw(v); setPage(0); };
  const setMinBuyLimit = (v: number) => { setMinBuyLimitRaw(v); setPage(0); };
  const setSortKey = (v: SortKey) => { setSortKeyRaw(v); setPage(0); };
  const setSortDir = (v: SortDir | ((prev: SortDir) => SortDir)) => {
    setSortDirRaw(v);
    setPage(0);
  };

  useEffect(() => { fetchIfNeeded(); }, [fetchIfNeeded]);

  const natureRuneCost = prices["561"]?.high ?? 250;

  const rows = useMemo(() => {
    const result: AlchRow[] = [];
    for (const item of items) {
      if (!item.highalch || item.highalch <= 0) continue;
      const price = prices[String(item.id)];
      const buyPrice = price?.high;
      if (buyPrice == null || buyPrice <= 0) continue;

      const profit = item.highalch - buyPrice - natureRuneCost;
      const roi = (profit / buyPrice) * 100;
      result.push({ item, buyPrice, highalch: item.highalch, profit, roi });
    }
    return result;
  }, [items, prices, natureRuneCost]);

  const filtered = useMemo(() => {
    let result = rows;

    if (minProfit > 0) {
      result = result.filter((r) => r.profit >= minProfit);
    }
    if (membersFilter === "f2p") {
      result = result.filter((r) => !r.item.members);
    }
    if (membersFilter === "p2p") {
      result = result.filter((r) => r.item.members);
    }
    if (minBuyLimit > 0) {
      result = result.filter(
        (r) => r.item.limit != null && r.item.limit >= minBuyLimit
      );
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "profit":
          cmp = a.profit - b.profit;
          break;
        case "roi":
          cmp = a.roi - b.roi;
          break;
        case "name":
          cmp = a.item.name.localeCompare(b.item.name);
          break;
        case "buyPrice":
          cmp = a.buyPrice - b.buyPrice;
          break;
        case "highalch":
          cmp = a.highalch - b.highalch;
          break;
        case "limit":
          cmp = (a.item.limit ?? 0) - (b.item.limit ?? 0);
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [rows, minProfit, membersFilter, minBuyLimit, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages - 1);
  const pageStart = clampedPage * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, filtered.length);
  const paginated = filtered.slice(pageStart, pageEnd);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDir === "desc" ? " \u25BC" : " \u25B2";
  };

  if (loading) {
    return (
      <div className="space-y-2 py-4">
        <div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-3/4" />
        <div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-1/2" />
        <div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-2/3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl">
        <h2 className="text-xl font-semibold mb-4">High Alchemy Profits</h2>
        <p className="text-sm text-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-semibold mb-1">High Alchemy Profit Table</h2>
      <p className="text-sm text-text-secondary mb-4">
        Nature rune:{" "}
        <span className="text-warning font-medium">
          {formatGp(natureRuneCost)} gp
        </span>
      </p>

      {error && (
        <p className="text-xs text-danger mb-2">{error}</p>
      )}

      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div>
          <label className="block text-xs text-text-secondary mb-1">
            Min Profit
          </label>
          <input
            type="number"
            value={minProfit || ""}
            onChange={(e) => setMinProfit(Number(e.target.value) || 0)}
            placeholder="0"
            className="w-28 bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">
            Min Buy Limit
          </label>
          <input
            type="number"
            value={minBuyLimit || ""}
            onChange={(e) => setMinBuyLimit(Number(e.target.value) || 0)}
            placeholder="0"
            className="w-28 bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "f2p", "p2p"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setMembersFilter(f)}
              aria-pressed={membersFilter === f}
              className={`px-3 py-2 rounded text-xs uppercase ${
                membersFilter === f
                  ? "bg-accent text-white"
                  : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        {(minProfit > 0 || minBuyLimit > 0 || membersFilter !== "all") && (
          <button
            onClick={() => {
              setMinProfit(0);
              setMinBuyLimit(0);
              setMembersFilter("all");
            }}
            className="text-xs text-text-secondary hover:text-text-primary transition-colors self-end pb-2"
          >
            Reset Filters
          </button>
        )}
      </div>

      <p className="text-xs text-text-secondary mb-2">
        {filtered.length} items
        {filtered.length > 0 && (
          <>
            {" "}— showing {pageStart + 1}-{pageEnd}
          </>
        )}
      </p>

      {filtered.length > 0 && (
        <div className="bg-bg-secondary rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary text-xs">
                <th
                  scope="col"
                  className="text-left px-4 py-2 cursor-pointer hover:text-text-primary"
                  onClick={() => handleSort("name")}
                >
                  Item{sortIndicator("name")}
                </th>
                <th
                  scope="col"
                  className="text-right px-4 py-2 cursor-pointer hover:text-text-primary"
                  onClick={() => handleSort("buyPrice")}
                >
                  GE Buy{sortIndicator("buyPrice")}
                </th>
                <th
                  scope="col"
                  className="text-right px-4 py-2 cursor-pointer hover:text-text-primary"
                  onClick={() => handleSort("highalch")}
                >
                  High Alch{sortIndicator("highalch")}
                </th>
                <th
                  scope="col"
                  className="text-right px-4 py-2 cursor-pointer hover:text-text-primary"
                  onClick={() => handleSort("profit")}
                >
                  Profit{sortIndicator("profit")}
                </th>
                <th
                  scope="col"
                  className="text-right px-4 py-2 cursor-pointer hover:text-text-primary"
                  onClick={() => handleSort("roi")}
                >
                  Profit%{sortIndicator("roi")}
                </th>
                <th
                  scope="col"
                  className="text-right px-4 py-2 cursor-pointer hover:text-text-primary"
                  onClick={() => handleSort("limit")}
                >
                  Buy Limit{sortIndicator("limit")}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((row) => (
                <tr
                  key={row.item.id}
                  className="border-b border-border/50 even:bg-bg-primary/30 hover:bg-bg-tertiary transition-colors"
                >
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2 font-medium">
                      <img src={itemIcon(row.item.name)} alt="" className="w-5 h-5 shrink-0" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      <ItemTooltip itemName={row.item.name}><span className="cursor-default">{row.item.name}</span></ItemTooltip>
                    </div>
                    {row.item.members && (
                      <span className="text-xs text-warning">P2P</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatGp(row.buyPrice)}
                  </td>
                  <td className="px-4 py-2 text-right text-warning">
                    {formatGp(row.highalch)}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-medium ${
                      row.profit >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {row.profit >= 0 ? "+" : ""}
                    {formatGp(row.profit)}
                  </td>
                  <td
                    className={`px-4 py-2 text-right ${
                      row.roi >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {row.roi >= 0 ? "+" : ""}
                    {row.roi.toFixed(1)}%
                  </td>
                  <td className="px-4 py-2 text-right text-text-secondary">
                    {row.item.limit ?? "\u2014"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 px-4 py-2 text-xs text-text-secondary border-t border-border">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={clampedPage === 0}
                className="px-2 py-1 rounded bg-bg-tertiary disabled:opacity-40 hover:bg-bg-primary transition-colors"
              >
                {"\u2190 Prev"}
              </button>
              <span>
                Page {clampedPage + 1} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={clampedPage >= totalPages - 1}
                className="px-2 py-1 rounded bg-bg-tertiary disabled:opacity-40 hover:bg-bg-primary transition-colors"
              >
                {"Next \u2192"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
