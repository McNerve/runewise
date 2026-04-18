import { useState, useEffect, useMemo } from "react";
import { BOSS_DROP_TABLES } from "../../../lib/data/boss-drops";
import { BOSSES } from "../../../lib/data/bosses";
import { fetchLatestPrices, type ItemPrice } from "../../../lib/api/ge";
import { formatGp } from "../../../lib/format";
import { bossIconSmall } from "../../../lib/sprites";
import WikiImage from "../../../components/WikiImage";
import { Skeleton } from "../../../components/Skeleton";
import ItemTooltip from "../../../components/ItemTooltip";
import type { View } from "../../../lib/features";

interface BossProfit {
  name: string;
  killsPerHour: number | null;
  gpPerKill: number | null;
  gpPerHour: number | null;
  uniqueCount: number;
  topUnique: string;
  topUniqueValue: number | null;
  hasDropData: boolean;
}

type SortKey = "gpPerHour" | "gpPerKill" | "killsPerHour" | "name";

export default function BossProfitRanking({
  navigate,
}: {
  navigate: (view: View, params?: Record<string, string>) => void;
}) {
  const [prices, setPrices] = useState<Record<string, ItemPrice>>({});
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("gpPerHour");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetchLatestPrices()
      .then((p) => {
        setPrices(p);
        setPricesLoaded(true);
      })
      .catch(() => setPricesLoaded(true));
  }, []);

  const rankings = useMemo<BossProfit[]>(() => {
    const dropTablesByName = new Map(
      BOSS_DROP_TABLES.map((b) => [b.bossName.toLowerCase(), b])
    );

    return BOSSES.map((boss) => {
      const dropTable = dropTablesByName.get(boss.name.toLowerCase());
      if (!dropTable) {
        return {
          name: boss.name,
          killsPerHour: null,
          gpPerKill: null,
          gpPerHour: null,
          uniqueCount: 0,
          topUnique: "",
          topUniqueValue: null,
          hasDropData: false,
        } satisfies BossProfit;
      }

      let totalEvPerKill = 0;
      let topUnique = "";
      let topUniqueValue: number | null = null;

      for (const drop of dropTable.drops) {
        const p = prices[String(drop.itemId)];
        const gePrice = p?.high ?? p?.low ?? null;
        if (gePrice != null) {
          const ev = (drop.quantity * gePrice) / drop.rate;
          totalEvPerKill += ev;

          if (
            drop.category === "unique" &&
            (topUniqueValue === null || gePrice > topUniqueValue)
          ) {
            topUnique = drop.itemName;
            topUniqueValue = gePrice;
          }
        }
      }

      return {
        name: dropTable.bossName,
        killsPerHour: dropTable.killsPerHour,
        gpPerKill: Math.round(totalEvPerKill),
        gpPerHour: Math.round(totalEvPerKill * dropTable.killsPerHour),
        uniqueCount: dropTable.drops.filter((d) => d.category === "unique").length,
        topUnique,
        topUniqueValue,
        hasDropData: true,
      } satisfies BossProfit;
    });
  }, [prices]);

  const sorted = useMemo(() => {
    return [...rankings].sort((a, b) => {
      // Always surface rows with drop data above rows without
      if (a.hasDropData !== b.hasDropData) {
        return a.hasDropData ? -1 : 1;
      }

      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      const aNum = typeof aVal === "number" ? aVal : null;
      const bNum = typeof bVal === "number" ? bVal : null;

      if (aNum == null && bNum == null) return a.name.localeCompare(b.name);
      if (aNum == null) return 1;
      if (bNum == null) return -1;

      return sortAsc ? aNum - bNum : bNum - aNum;
    });
  }, [rankings, sortKey, sortAsc]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const withDropData = rankings.filter((b) => b.hasDropData).length;
  const totalBosses = BOSSES.length;

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-text-primary">
          Boss Profit Ranking
        </h3>
        <p className="text-xs text-text-secondary mt-0.5">
          All {totalBosses} tracked bosses — {withDropData} with curated drop data ranked by GP/hr. Bosses without drop data sit at the bottom; open the wiki or Boss Guides for their loot details.
        </p>
      </div>

      <div className="rounded-xl border border-border/60 overflow-hidden">
        <table className="w-full text-left">
          <thead className="sticky-thead">
            <tr className="border-b border-border text-text-secondary text-xs">
              <th className="px-2 py-2 w-8 text-center">#</th>
              <th className="px-2 py-2 w-6" />
              <th
                className="px-2 py-2 cursor-pointer hover:text-text-primary"
                onClick={() => handleSort("name")}
              >
                Boss {sortKey === "name" && (sortAsc ? "\u2191" : "\u2193")}
              </th>
              <th
                className="px-2 py-2 text-right cursor-pointer hover:text-text-primary"
                onClick={() => handleSort("gpPerHour")}
              >
                GP/Hr {sortKey === "gpPerHour" && (sortAsc ? "\u2191" : "\u2193")}
              </th>
              <th
                className="px-2 py-2 text-right cursor-pointer hover:text-text-primary"
                onClick={() => handleSort("gpPerKill")}
              >
                GP/Kill {sortKey === "gpPerKill" && (sortAsc ? "\u2191" : "\u2193")}
              </th>
              <th
                className="px-2 py-2 text-right cursor-pointer hover:text-text-primary"
                onClick={() => handleSort("killsPerHour")}
              >
                Kills/Hr {sortKey === "killsPerHour" && (sortAsc ? "\u2191" : "\u2193")}
              </th>
              <th className="px-2 py-2 text-right">Top Unique</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((boss, i) => (
              <tr
                key={boss.name}
                className={`border-b border-border/20 even:bg-bg-primary/25 hover:bg-bg-secondary/30 cursor-pointer transition-colors ${
                  boss.hasDropData ? "" : "opacity-60"
                }`}
                onClick={() => navigate("bosses", { boss: boss.name, tab: "drops" })}
              >
                <td className="px-2 py-2 text-center text-xs tabular-nums text-text-secondary">
                  {i + 1}
                </td>
                <td className="px-2 py-2">
                  <WikiImage
                    src={bossIconSmall(boss.name)}
                    alt=""
                    className="w-5 h-5"
                    fallback={String(i + 1)}
                  />
                </td>
                <td className="px-2 py-2 text-sm font-medium">{boss.name}</td>
                <td className="px-2 py-2 text-right text-sm tabular-nums text-success font-medium">
                  {boss.gpPerHour != null ? formatGp(boss.gpPerHour) : "\u2014"}
                </td>
                <td className="px-2 py-2 text-right text-xs tabular-nums text-text-secondary">
                  {boss.gpPerKill != null ? formatGp(boss.gpPerKill) : "\u2014"}
                </td>
                <td className="px-2 py-2 text-right text-xs tabular-nums text-text-secondary">
                  {boss.killsPerHour ?? "\u2014"}
                </td>
                <td className="px-2 py-2 text-right text-xs text-text-secondary truncate max-w-[120px]">
                  {boss.topUnique ? (
                    <ItemTooltip itemName={boss.topUnique}>
                      <span className="cursor-default">{boss.topUnique}</span>
                    </ItemTooltip>
                  ) : (
                    "\u2014"
                  )}
                  {boss.topUniqueValue != null && (
                    <span className="ml-1 text-accent">{formatGp(boss.topUniqueValue)}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!pricesLoaded && (
        <div className="text-center py-8 text-text-secondary">
          <Skeleton className="h-4 w-32 mx-auto mb-2" />
          <p className="text-sm">Loading price data...</p>
        </div>
      )}
    </div>
  );
}
