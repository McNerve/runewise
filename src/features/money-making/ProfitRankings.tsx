import { useState, useEffect, useMemo } from "react";
import { MONEY_METHODS, type MoneyMethod } from "../../lib/data/money-methods";
import { BOSS_DROP_TABLES } from "../../lib/data/boss-drops";
import { fetchLatestPrices, type ItemPrice } from "../../lib/api/ge";
import { formatGp } from "../../lib/format";
import { useNavigation } from "../../lib/NavigationContext";

type Source = "all" | "combat" | "skilling";

interface ProfitEntry {
  name: string;
  source: "Boss Loot" | "Money Method";
  category: string;
  gpPerHour: number;
  intensity?: string;
  levelReq?: string;
}

function bossGpPerKill(
  drops: { itemId: number; rate: number; quantity: number }[],
  prices: Record<string, ItemPrice>
): number {
  let total = 0;
  for (const drop of drops) {
    const price =
      prices[String(drop.itemId)]?.high ??
      prices[String(drop.itemId)]?.low ??
      0;
    total += (drop.quantity * price) / drop.rate;
  }
  return total;
}

function methodToEntry(m: MoneyMethod): ProfitEntry {
  return {
    name: m.name,
    source: "Money Method",
    category: m.category,
    gpPerHour: m.baseGpPerHr,
    intensity: m.intensity,
    levelReq:
      m.skills.length > 0
        ? m.skills.map((s) => `${s.level} ${s.name}`).join(", ")
        : undefined,
  };
}

export default function ProfitRankings() {
  const { navigate } = useNavigation();
  const [prices, setPrices] = useState<Record<string, ItemPrice>>({});
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<Source>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLatestPrices().then((p) => {
      setPrices(p);
      setPricesLoaded(true);
    });
  }, []);

  const entries = useMemo<ProfitEntry[]>(() => {
    const result: ProfitEntry[] = [];

    // Money methods
    for (const m of MONEY_METHODS) {
      result.push(methodToEntry(m));
    }

    // Boss loot (live prices)
    for (const boss of BOSS_DROP_TABLES) {
      const gpPerKill = bossGpPerKill(boss.drops, prices);
      if (gpPerKill <= 0) continue;
      result.push({
        name: boss.bossName,
        source: "Boss Loot",
        category: "Combat",
        gpPerHour: Math.round(gpPerKill * boss.killsPerHour),
        levelReq: `${boss.killsPerHour} kills/hr`,
      });
    }

    // Deduplicate: prefer Boss Loot entries over Money Method entries for same name
    const bossNames = new Set(result.filter(e => e.source === "Boss Loot").map(e => e.name.toLowerCase()));
    return result.filter(e => !(e.source === "Money Method" && e.category === "Combat" && bossNames.has(e.name.toLowerCase())));
  }, [prices]);

  const filtered = useMemo(() => {
    let result = entries;

    if (sourceFilter === "combat")
      result = result.filter((e) => e.category === "Combat" || e.source === "Boss Loot");
    else if (sourceFilter === "skilling")
      result = result.filter(
        (e) => e.category === "Skilling" || e.category === "Processing" || e.category === "Collecting"
      );

    // Deduplicate by name
    const seen = new Set<string>();
    result = result.filter((e) => {
      const key = e.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (search.length >= 2) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.name.toLowerCase().includes(q));
    }

    return [...result].sort((a, b) => b.gpPerHour - a.gpPerHour);
  }, [entries, sourceFilter, search]);

  const maxGp = filtered.length > 0 ? filtered[0].gpPerHour : 1;

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-semibold tracking-tight mb-1">Profit Rankings</h2>
      <p className="text-xs text-text-secondary/60 mb-5">
        All GP-earning activities ranked by hourly profit. Boss loot uses live
        GE prices.
      </p>

      {!pricesLoaded && (
        <p className="text-xs text-text-secondary mb-4">Loading live prices for boss loot calculations...</p>
      )}

      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search methods..."
          aria-label="Search profit methods"
          className="flex-1 min-w-[180px] px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-colors"
        />
        <div className="flex gap-1">
          {(
            [
              { id: "all", label: "All" },
              { id: "combat", label: "Combat & Bosses" },
              { id: "skilling", label: "Skilling" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setSourceFilter(f.id)}
              aria-pressed={sourceFilter === f.id}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                sourceFilter === f.id
                  ? "bg-accent text-on-accent"
                  : "bg-bg-tertiary text-text-secondary hover:bg-bg-secondary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        {filtered.map((entry, i) => {
          const barWidth = maxGp > 0 ? (entry.gpPerHour / maxGp) * 100 : 0;
          return (
            <button
              key={`${entry.name}-${entry.source}`}
              onClick={() => {
                if (entry.source === "Boss Loot") {
                  navigate("bosses", { boss: entry.name });
                } else {
                  navigate("money-making");
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bg-secondary/70 transition-colors text-left group"
            >
              <span className="text-xs text-text-secondary/40 w-6 text-right tabular-nums shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {entry.name}
                  </span>
                  <span
                    className={`text-[9px] px-1 py-0.5 rounded shrink-0 ${
                      entry.source === "Boss Loot"
                        ? "bg-danger/10 text-danger"
                        : "bg-accent/10 text-accent"
                    }`}
                  >
                    {entry.source === "Boss Loot" ? "Boss" : entry.category}
                  </span>
                  {entry.intensity && (
                    <span
                      className={`text-[9px] px-1 py-0.5 rounded shrink-0 ${
                        entry.intensity === "afk"
                          ? "bg-success/10 text-success"
                          : entry.intensity === "low"
                            ? "bg-accent/10 text-accent"
                            : entry.intensity === "medium"
                              ? "bg-warning/10 text-warning"
                              : "bg-danger/10 text-danger"
                      }`}
                    >
                      {entry.intensity.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="mt-1 h-1 rounded-full bg-bg-tertiary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${barWidth}%`,
                      background: "linear-gradient(90deg, var(--color-accent) 0%, rgba(212, 165, 116, 0.4) 100%)",
                    }}
                  />
                </div>
              </div>
              <span className="text-sm font-semibold text-accent tabular-nums shrink-0">
                {formatGp(entry.gpPerHour)}/hr
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-text-secondary text-center py-8">
          No methods match your filters.
        </p>
      )}

      <p className="text-[10px] text-text-secondary/40 mt-4">
        {entries.filter((e) => e.source === "Boss Loot").length} bosses with
        live pricing · {entries.filter((e) => e.source === "Money Method").length}{" "}
        curated methods
      </p>
    </div>
  );
}
