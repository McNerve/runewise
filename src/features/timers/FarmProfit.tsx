import { useState, useEffect, useMemo } from "react";
import { FARM_CROPS, CROP_CATEGORIES } from "../../lib/data/farming-crops";
import { fetchLatestPrices, type ItemPrice } from "../../lib/api/ge";
import { formatGp } from "../../lib/format";

const WIKI_IMG = "https://oldschool.runescape.wiki/images";

export default function FarmProfit() {
  const [prices, setPrices] = useState<Record<string, ItemPrice>>({});
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"profit" | "profitPerHr" | "level">(
    "profitPerHr"
  );

  useEffect(() => {
    fetchLatestPrices().then((p) => {
      setPrices(p);
      setPricesLoaded(true);
    });
  }, []);

  const crops = useMemo(() => {
    return FARM_CROPS.map((crop) => {
      const seedPrice =
        prices[String(crop.seedId)]?.high ??
        prices[String(crop.seedId)]?.low ??
        null;
      const producePrice =
        prices[String(crop.produceId)]?.high ??
        prices[String(crop.produceId)]?.low ??
        null;

      const revenue =
        producePrice != null ? producePrice * crop.avgYield * crop.patches : null;
      const cost = seedPrice != null ? seedPrice * crop.patches : null;
      const profit =
        revenue != null && cost != null ? revenue - cost : null;
      const profitPerHr =
        profit != null ? profit / (crop.growthMinutes / 60) : null;

      return { ...crop, seedPrice, producePrice, revenue, cost, profit, profitPerHr };
    })
      .filter(
        (c) => categoryFilter === "All" || c.category === categoryFilter
      )
      .sort((a, b) => {
        if (sortBy === "level") return a.levelReq - b.levelReq;
        const av = sortBy === "profit" ? a.profit : a.profitPerHr;
        const bv = sortBy === "profit" ? b.profit : b.profitPerHr;
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        return bv - av;
      });
  }, [prices, categoryFilter, sortBy]);

  return (
    <div>
      {!pricesLoaded && (
        <p className="text-xs text-text-secondary mb-4">Loading live GE prices...</p>
      )}

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex gap-1">
          <button
            onClick={() => setCategoryFilter("All")}
            className={`px-2 py-0.5 rounded text-xs ${
              categoryFilter === "All"
                ? "bg-accent text-white"
                : "bg-bg-secondary text-text-secondary"
            }`}
          >
            All
          </button>
          {CROP_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2 py-0.5 rounded text-xs ${
                categoryFilter === cat
                  ? "bg-accent text-white"
                  : "bg-bg-secondary text-text-secondary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          {(
            [
              { id: "profitPerHr", label: "GP/hr" },
              { id: "profit", label: "Profit" },
              { id: "level", label: "Level" },
            ] as const
          ).map((s) => (
            <button
              key={s.id}
              onClick={() => setSortBy(s.id)}
              className={`px-2 py-0.5 rounded text-xs ${
                sortBy === s.id
                  ? "bg-accent text-white"
                  : "bg-bg-secondary text-text-secondary"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-bg-secondary rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary text-xs">
              <th className="text-left px-4 py-2">Crop</th>
              <th className="text-right px-4 py-2">Lvl</th>
              <th className="text-right px-4 py-2">Seed</th>
              <th className="text-right px-4 py-2">Produce</th>
              <th className="text-right px-4 py-2">Profit/Run</th>
              <th className="text-right px-4 py-2">GP/hr</th>
            </tr>
          </thead>
          <tbody>
            {crops.map((crop) => (
              <tr
                key={crop.name}
                className="border-b border-border/50 hover:bg-bg-tertiary transition-colors"
              >
                <td className="px-4 py-1.5">
                  <div className="flex items-center gap-2">
                    <img
                      src={`${WIKI_IMG}/${crop.seedName.replace(/ /g, "_")}_5.png`}
                      alt=""
                      className="w-5 h-5 shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div>
                      <span className="font-medium">{crop.name}</span>
                      <span className="ml-1.5 text-[10px] text-text-secondary/50">
                        {crop.patches}×
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-1.5 text-right text-text-secondary text-xs">
                  {crop.levelReq}
                </td>
                <td className="px-4 py-1.5 text-right text-danger text-xs tabular-nums">
                  {crop.seedPrice != null ? formatGp(crop.seedPrice) : "—"}
                </td>
                <td className="px-4 py-1.5 text-right text-success text-xs tabular-nums">
                  {crop.producePrice != null
                    ? formatGp(crop.producePrice)
                    : "—"}
                </td>
                <td
                  className={`px-4 py-1.5 text-right font-medium tabular-nums ${
                    crop.profit != null && crop.profit > 0
                      ? "text-success"
                      : crop.profit != null && crop.profit < 0
                        ? "text-danger"
                        : "text-text-secondary"
                  }`}
                >
                  {crop.profit != null ? formatGp(crop.profit) : "—"}
                </td>
                <td
                  className={`px-4 py-1.5 text-right font-medium tabular-nums ${
                    crop.profitPerHr != null && crop.profitPerHr > 0
                      ? "text-success"
                      : crop.profitPerHr != null && crop.profitPerHr < 0
                        ? "text-danger"
                        : "text-text-secondary"
                  }`}
                >
                  {crop.profitPerHr != null
                    ? formatGp(Math.round(crop.profitPerHr))
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-text-secondary/40 mt-3">
        Yields assume ultracompost at level 99. Profit = (yield × produce price
        × patches) − (seed price × patches). GP/hr based on growth time only.
      </p>
    </div>
  );
}
