import { useState, useEffect, useMemo } from "react";
import { searchMonsters, fetchDropTable, type DropItem } from "../../lib/api/wiki";
import { fetchDropsForMonster, fetchBossDropsFromWiki, type WikiDrop } from "../../lib/api/drops";
import { fetchLatestPrices, fetchMapping, type ItemPrice, type ItemMapping } from "../../lib/api/ge";
import { formatGp } from "../../lib/format";
import { itemIcon } from "../../lib/sprites";
import { useDebounce } from "../../hooks/useDebounce";
import { useNavigation, type View } from "../../lib/NavigationContext";
import WikiImage from "../../components/WikiImage";
import DropTable from "../../components/DropTable";
import { findBossByName, normalizeBossLookup } from "../../lib/data/bosses";
import { BOSS_DROP_TABLES, type BossDropTable } from "../../lib/data/boss-drops";
import { TableSkeleton } from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";

import BossProfitRanking from "./components/BossProfitRanking";
import ItemTooltip from "../../components/ItemTooltip";

type LootTab = "drops" | "profit" | "ranking";

const LOOT_TABS: Array<{ id: LootTab; label: string; description: string }> = [
  { id: "drops", label: "Drop Tables", description: "Search any monster's drops" },
  { id: "profit", label: "Profit Calculator", description: "GP/kill and GP/hr estimates" },
  { id: "ranking", label: "Boss Rankings", description: "Compare all boss profits" },
];

// --- Shared helpers ---

function RarityBar({ rarity }: { rarity: string }) {
  const match = rarity.match(/~?(\d+)\/([\d,]+)/);
  if (!match) return null;
  const numerator = parseInt(match[1]);
  const denominator = parseInt(match[2].replace(/,/g, ""));
  const rate = denominator / numerator;
  const width = Math.max(5, Math.min(100, (1 / rate) * 5000));
  const color = rate <= 16 ? "bg-text-secondary" : rate <= 128 ? "bg-accent" : rate <= 512 ? "bg-warning" : "bg-danger";
  return (
    <div className="w-full bg-bg-tertiary rounded-full h-1.5 mt-1">
      <div className={`rounded-full h-1.5 ${color}`} style={{ width: `${width}%` }} />
    </div>
  );
}

function rarityColor(rarity: string) {
  const r = rarity.toLowerCase();
  if (r.includes("always")) return "text-text-primary";
  if (r.includes("1/1") && !r.includes("1/1,") && !r.includes("1/10")) return "text-text-primary";
  if (r.includes("common") || r.startsWith("1/")) {
    const match = rarity.match(/1\/([\d,]+)/);
    if (match) {
      const denom = parseInt(match[1].replace(/,/g, ""));
      if (denom <= 16) return "text-text-secondary";
      if (denom <= 128) return "text-accent";
      if (denom <= 512) return "text-warning";
      return "text-danger";
    }
    return "text-text-secondary";
  }
  if (r.includes("uncommon")) return "text-accent";
  if (r.includes("rare")) return "text-warning";
  if (r.includes("very rare")) return "text-danger";
  return "text-text-secondary";
}

// --- Profit Calculator helpers ---

interface ProfitRow {
  itemName: string;
  itemId: number | null;
  rate: number | null;
  quantity: number | null;
  category: "unique" | "rare" | "common";
  gePrice: number | null;
  evPerKill: number | null;
  evPerHr: number | null;
}

function parseRate(rarity: string): number | null {
  const lower = rarity.toLowerCase();
  if (lower.includes("always")) return 1;
  const match = lower.match(/1\s*\/\s*([\d.,]+)/);
  if (!match) return null;
  const parsed = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseQuantity(quantity: string): number | null {
  const values = Array.from(
    quantity.matchAll(/(\d[\d,]*(?:\.\d+)?)/g),
    (match) => Number(match[1].replace(/,/g, ""))
  ).filter((value) => Number.isFinite(value));
  if (values.length === 0) return null;
  if (values.length === 1) return values[0];
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

// --- Drop Tables tab ---

function DropTablesTab({
  prices,
  itemMap,
  iconMap,
  navigate,
  initialMonster,
}: {
  prices: Record<string, ItemPrice>;
  itemMap: Map<string, number>;
  iconMap: Map<string, string>;
  navigate: (view: View, params?: Record<string, string>) => void;
  initialMonster: string | undefined;
}) {
  const [query, setQuery] = useState(initialMonster ?? "");
  const debouncedQuery = useDebounce(query, 300);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedMonster, setSelectedMonster] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ name: string; drops: DropItem[] }[]>([]);
  const [bucketDrops, setBucketDrops] = useState<WikiDrop[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const selectedBoss = selectedMonster ? findBossByName(selectedMonster) : null;

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([]); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    let cancelled = false;
    searchMonsters(debouncedQuery).then((results) => {
      if (!cancelled) {
        setSuggestions(results);
        setShowSuggestions(true);
      }
    });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const selectMonster = async (name: string) => {
    setSelectedMonster(name);
    setQuery(name);
    setShowSuggestions(false);
    setLoading(true);
    setBucketDrops([]);
    const [htmlData, bucketData] = await Promise.all([
      fetchDropTable(name).catch(() => ({ categories: [] })),
      fetchDropsForMonster(name).then((t) => t.drops).catch(() => [] as WikiDrop[]),
    ]);
    setCategories(htmlData.categories);
    setBucketDrops(bucketData);
    setLoading(false);
  };

  useEffect(() => {
    if (initialMonster) selectMonster(initialMonster); // eslint-disable-line react-hooks/set-state-in-effect
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mt-1 text-sm text-text-secondary">
            Search monsters, inspect wiki drop tables, and jump into related combat workflows.
          </p>
        </div>
        {selectedMonster ? (
          <div className="flex flex-wrap gap-2">
            {selectedBoss ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate("bosses", { boss: selectedBoss.name, tab: "drops" })}
                  className="rounded-xl border border-border bg-bg-secondary px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-accent/35 hover:text-text-primary"
                >
                  Open Boss Workspace
                </button>
                <button
                  type="button"
                  onClick={() => navigate("bosses", { boss: selectedBoss.name, tab: "tasks" })}
                  className="rounded-xl border border-border bg-bg-secondary px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-accent/35 hover:text-text-primary"
                >
                  Combat Tasks
                </button>
                <button
                  type="button"
                  onClick={() => navigate("dps-calc", { monster: selectedBoss.name })}
                  className="rounded-xl border border-border bg-bg-secondary px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-accent/35 hover:text-text-primary"
                >
                  DPS
                </button>
              </>
            ) : null}
            <a
              href={`https://oldschool.runescape.wiki/w/${encodeURIComponent(selectedMonster.replace(/ /g, "_"))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-border bg-bg-secondary px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-accent/35 hover:text-text-primary"
            >
              Open Wiki
            </a>
          </div>
        ) : null}
      </div>

      <div className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedMonster(null);
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && suggestions.length > 0) {
              e.preventDefault();
              selectMonster(suggestions[0]);
            }
          }}
          placeholder="Search monsters..."
          aria-label="Search monsters"
          className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-bg-secondary border border-border rounded-lg overflow-hidden z-10 shadow-lg">
            {suggestions.map((name) => (
              <button
                key={name}
                onClick={() => selectMonster(name)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-bg-tertiary transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && <TableSkeleton rows={8} cols={4} />}

      {selectedMonster && !loading && categories.length === 0 && bucketDrops.length === 0 && (
        <EmptyState
          title={`No drop table found for ${selectedMonster}`}
          description="This monster may not have a wiki drop table, or the name might be slightly different."
        />
      )}

      {selectedMonster && !loading && bucketDrops.length > 0 && (
        <DropTable
          drops={bucketDrops}
          prices={prices}
          itemMap={itemMap}
          iconMap={iconMap}
          showProfit
          killsPerHour={20}
        />
      )}

      {selectedMonster && !loading && bucketDrops.length === 0 && categories.map((cat) => (
        <div key={cat.name} className="mb-4">
          <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">
            {cat.name}
          </h3>
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary text-xs">
                  <th scope="col" className="text-left px-4 py-2">Item</th>
                  <th scope="col" className="text-right px-4 py-2">Qty</th>
                  <th scope="col" className="text-right px-4 py-2">Rate</th>
                  <th scope="col" className="text-right px-4 py-2">Price</th>
                </tr>
              </thead>
              <tbody>
                {cat.drops.map((drop, i) => (
                  <tr
                    key={`${drop.name}-${i}`}
                    className="border-b border-border/50 even:bg-bg-primary/30 hover:bg-bg-tertiary transition-colors"
                  >
                    <td className="px-4 py-1.5 font-medium">
                      <button
                        onClick={() => navigate("market", { query: drop.name })}
                        className="hover:text-accent transition-colors text-left flex items-center gap-2"
                      >
                        <WikiImage src={itemIcon(drop.name)} alt="" className="w-5 h-5 shrink-0" fallback={drop.name[0]} />
                        {drop.name}
                      </button>
                    </td>
                    <td className="px-4 py-1.5 text-right text-text-secondary">{drop.quantity}</td>
                    <td className={`px-4 py-1.5 text-right ${rarityColor(drop.rarity)}`}>
                      {drop.rarity}
                      <RarityBar rarity={drop.rarity} />
                    </td>
                    <td className="px-4 py-1.5 text-right text-success">
                      {(() => {
                        const itemId = itemMap.get(drop.name.toLowerCase());
                        const price = itemId ? prices[String(itemId)] : null;
                        const gePrice = price?.high ?? price?.low ?? null;
                        return gePrice != null ? formatGp(gePrice) : (drop.price || "\u2014");
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </>
  );
}

// --- Profit Calculator tab ---

function ProfitCalculatorTab({
  prices,
  mapping,
  loading: priceLoading,
  navigate,
  initialBoss,
}: {
  prices: Record<string, ItemPrice>;
  mapping: ItemMapping[];
  loading: boolean;
  navigate: (view: View, params?: Record<string, string>) => void;
  initialBoss: string | undefined;
}) {
  const [selectedBoss, setSelectedBoss] = useState<BossDropTable | null>(BOSS_DROP_TABLES[0]);
  const [killsPerHour, setKillsPerHour] = useState(BOSS_DROP_TABLES[0].killsPerHour);
  const [unsupportedBoss, setUnsupportedBoss] = useState<string | null>(null);
  const [wikiFallbackBoss, setWikiFallbackBoss] = useState<string | null>(null);
  const [wikiDropCategories, setWikiDropCategories] = useState<{ name: string; drops: DropItem[] }[]>([]);
  const [wikiFallbackLoading, setWikiFallbackLoading] = useState(false);
  const [fullWikiDrops, setFullWikiDrops] = useState<WikiDrop[]>([]);
  const [wikiDropsLoading, setWikiDropsLoading] = useState(false);

  const mappingById = useMemo(() => {
    const map = new Map<number, ItemMapping>();
    for (const item of mapping) map.set(item.id, item);
    return map;
  }, [mapping]);

  const mappingByName = useMemo(() => {
    const map = new Map<string, ItemMapping>();
    for (const item of mapping) map.set(item.name.toLowerCase(), item);
    return map;
  }, [mapping]);

  const getPrice = (itemId: number, itemName?: string): number | null => {
    const p = prices[String(itemId)];
    if (p) {
      if (p.high != null && p.low != null) return Math.round((p.high + p.low) / 2);
      return p.high ?? p.low ?? null;
    }
    if (itemName) {
      const mapped = mappingByName.get(itemName.toLowerCase());
      if (mapped) {
        const p2 = prices[String(mapped.id)];
        if (p2) {
          if (p2.high != null && p2.low != null) return Math.round((p2.high + p2.low) / 2);
          return p2.high ?? p2.low ?? null;
        }
      }
    }
    return null;
  };

  const getItemName = (itemId: number, fallback: string): string => {
    return mappingById.get(itemId)?.name ?? fallback;
  };

  const rows: ProfitRow[] = useMemo(() => {
    if (!selectedBoss) return [];
    return selectedBoss.drops.map((drop) => {
      const price = getPrice(drop.itemId, drop.itemName);
      const ev = price != null ? (drop.quantity * price) / drop.rate : null;
      return {
        itemName: getItemName(drop.itemId, drop.itemName),
        itemId: drop.itemId,
        rate: drop.rate,
        quantity: drop.quantity,
        category: drop.category,
        gePrice: price,
        evPerKill: ev,
        evPerHr: ev != null ? ev * killsPerHour : null,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBoss, killsPerHour, prices, mapping]);

  const wikiRows: ProfitRow[] = useMemo(() => {
    return wikiDropCategories
      .flatMap((category) => category.drops)
      .map((drop) => {
        const mappedItem = mappingByName.get(drop.name.toLowerCase()) ?? null;
        const itemId = mappedItem?.id ?? null;
        const rate = parseRate(drop.rarity);
        const quantity = parseQuantity(drop.quantity);
        const gePrice = itemId != null ? getPrice(itemId) : null;
        const lowerCategory = drop.category.toLowerCase();
        const categoryType: ProfitRow["category"] = lowerCategory.includes("unique")
          ? "unique"
          : lowerCategory.includes("rare")
            ? "rare"
            : "common";
        const evPerKill =
          gePrice != null && rate != null && quantity != null
            ? (quantity * gePrice) / rate
            : null;
        return {
          itemName: drop.name,
          itemId,
          rate,
          quantity,
          category: categoryType,
          gePrice,
          evPerKill,
          evPerHr: evPerKill != null ? evPerKill * killsPerHour : null,
        };
      })
      .filter((row) => row.rate != null || row.gePrice != null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wikiDropCategories, mappingByName, prices, killsPerHour]);

  // Build profit rows from full wiki drops (includes ALL items for accurate GP/hr)
  const fullWikiRows: ProfitRow[] = useMemo(() => {
    if (fullWikiDrops.length === 0) return [];
    return fullWikiDrops.map((drop) => {
      const mappedItem = mappingByName.get(drop.itemName.toLowerCase()) ?? null;
      const itemId = mappedItem?.id ?? null;
      const fraction = drop.rarityFraction;
      const rate = fraction != null && fraction > 0 ? 1 / fraction : null;
      const qty = drop.quantityLow === drop.quantityHigh
        ? drop.quantityLow
        : (drop.quantityLow + drop.quantityHigh) / 2;
      const gePrice = itemId != null ? getPrice(itemId, drop.itemName) : null;
      const evPerKill = gePrice != null && fraction != null ? qty * gePrice * fraction : null;
      return {
        itemName: drop.itemName,
        itemId,
        rate,
        quantity: qty,
        category: (drop.dropType?.toLowerCase().includes("unique") ? "unique" : drop.dropType?.toLowerCase().includes("rare") ? "rare" : "common") as ProfitRow["category"],
        gePrice,
        evPerKill,
        evPerHr: evPerKill != null ? evPerKill * killsPerHour : null,
      };
    }).filter((r) => r.evPerKill != null && r.evPerKill > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullWikiDrops, mappingByName, prices, killsPerHour]);

  // Merge: use wiki drops for common items + curated data for uniques (curated has accurate rates for rare drops)
  const mergedRows = useMemo(() => {
    if (fullWikiRows.length === 0) return selectedBoss ? rows : wikiRows;
    if (!selectedBoss) return fullWikiRows;

    // Keep ALL curated items (they have verified rates), supplement with wiki drops not in curated
    const curatedNames = new Set(rows.map((r) => r.itemName.toLowerCase()));
    const wikiExtras = fullWikiRows.filter((r) => !curatedNames.has(r.itemName.toLowerCase()));

    return [...rows, ...wikiExtras];
  }, [fullWikiRows, rows, wikiRows, selectedBoss]);

  const effectiveRows = mergedRows;
  const totalGpPerKill = effectiveRows.reduce((sum, r) => sum + (r.evPerKill ?? 0), 0);
  const totalGpPerHr = effectiveRows.reduce((sum, r) => sum + (r.evPerHr ?? 0), 0);

  const handleBossChange = (bossName: string) => {
    const boss = BOSS_DROP_TABLES.find((b) => b.bossName === bossName);
    if (!boss) return;
    setUnsupportedBoss(null);
    setWikiFallbackBoss(null);
    setWikiDropCategories([]);
    setSelectedBoss(boss);
    setKillsPerHour(boss.killsPerHour);
    // Fetch full wiki drops for accurate GP/hr
    setWikiDropsLoading(true);
    setFullWikiDrops([]);
    fetchDropsForMonster(bossName)
      .then((t) => setFullWikiDrops(t.drops))
      .catch(() => setFullWikiDrops([]))
      .finally(() => setWikiDropsLoading(false));
  };

  const categoryColor = (cat: string) => {
    switch (cat) {
      case "unique": return "text-accent";
      case "rare": return "text-warning";
      default: return "text-text-secondary";
    }
  };

  const linkedBoss = selectedBoss ? findBossByName(selectedBoss.bossName) : null;

  // Fetch wiki drops for the initial/default boss
  useEffect(() => {
    const bossName = selectedBoss?.bossName;
    if (!bossName || fullWikiDrops.length > 0) return;
    setWikiDropsLoading(true);
    fetchDropsForMonster(bossName)
      .then((t) => setFullWikiDrops(t.drops))
      .catch(() => {})
      .finally(() => setWikiDropsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!initialBoss) return;
    let cancelled = false;
    const routedBoss = findBossByName(initialBoss) ?? { name: initialBoss };
    const nextBoss = BOSS_DROP_TABLES.find(
      (boss) =>
        normalizeBossLookup(boss.bossName) === normalizeBossLookup(routedBoss.name)
    );
    if (!nextBoss) {
      if ("category" in routedBoss && routedBoss.category === "Raids") {
        setUnsupportedBoss(routedBoss.name);
        setWikiFallbackBoss(null);
        setWikiDropCategories([]);
        setSelectedBoss(null);
        return;
      }
      setUnsupportedBoss(null);
      setSelectedBoss(null);
      setWikiFallbackBoss(routedBoss.name);
      setWikiFallbackLoading(true);
      void fetchBossDropsFromWiki(routedBoss.name)
        .then(async (bucketRows) => {
          if (cancelled) return;
          if (bucketRows.length > 0) {
            // bucket drop_table had data — convert to category format for wikiRows
            setWikiDropCategories([{
              name: "Drops",
              drops: bucketRows.map((r) => ({
                name: r.item,
                quantity: r.quantity,
                rarity: r.rate === 1 ? "Always" : r.rate > 0 ? `1/${r.rate}` : "Varies",
                price: "",
                category: "drop",
              })),
            }]);
            return;
          }
          // No bucket data — fall back to HTML wiki drop table
          const result = await fetchDropTable(routedBoss.name).catch(() => ({ categories: [] }));
          if (cancelled) return;
          if (result.categories.length === 0) {
            setUnsupportedBoss(routedBoss.name);
            setWikiFallbackBoss(null);
            setWikiDropCategories([]);
            return;
          }
          setUnsupportedBoss(null);
          setWikiDropCategories(result.categories);
        })
        .catch(() => {
          if (cancelled) return;
          setUnsupportedBoss(routedBoss.name);
          setWikiFallbackBoss(null);
          setWikiDropCategories([]);
        })
        .finally(() => {
          if (!cancelled) setWikiFallbackLoading(false);
        });
      return () => { cancelled = true; };
    }
    if (nextBoss.bossName === selectedBoss?.bossName) return;
    setUnsupportedBoss(null);
    setWikiFallbackBoss(null);
    setWikiDropCategories([]);
    setSelectedBoss(nextBoss);
    setKillsPerHour(nextBoss.killsPerHour);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBoss]);

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mt-1 text-sm text-text-secondary">
            Estimate expected GP per kill and per hour, then jump back into the connected boss workspace.
          </p>
          {wikiFallbackBoss ? (
            <p className="mt-1 text-xs text-text-secondary">
              Using wiki-derived drop data for {wikiFallbackBoss}.
            </p>
          ) : null}
        </div>
        {linkedBoss ? (
          <button
            type="button"
            onClick={() => navigate("bosses", { boss: linkedBoss.name, tab: "drops" })}
            className="rounded-xl border border-border bg-bg-secondary px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-accent/35 hover:text-text-primary"
          >
            Open Boss Workspace
          </button>
        ) : null}
      </div>

      {unsupportedBoss ? (
        <div className="mb-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-text-primary">
          <div className="font-medium">No curated loot calculator yet for {unsupportedBoss}</div>
          <div className="mt-1 text-xs text-text-secondary">
            RuneWise can still show wiki drops for this boss in Boss Guides, but the standalone calculator only supports curated bosses and non-raid bosses with parseable wiki drop data so far.
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl border border-border/60 p-4 text-center">
          <div className="text-xs text-text-secondary mb-1">Expected GP / Kill</div>
          <div className="text-2xl font-bold text-success">
            {priceLoading || wikiFallbackLoading || wikiDropsLoading ? "..." : formatGp(Math.round(totalGpPerKill))}
          </div>
        </div>
        <div className="rounded-xl border border-border/60 p-4 text-center">
          <div className="text-xs text-text-secondary mb-1">Expected GP / Hour</div>
          <div className="text-2xl font-bold text-success">
            {priceLoading || wikiFallbackLoading || wikiDropsLoading ? "..." : formatGp(Math.round(totalGpPerHr))}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-secondary mb-1">Boss</label>
            <select
              value={selectedBoss?.bossName ?? ""}
              onChange={(e) => handleBossChange(e.target.value)}
              className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
            >
              {wikiFallbackBoss ? (
                <option value="" disabled>
                  {wikiFallbackBoss} (wiki-derived)
                </option>
              ) : null}
              {[...BOSS_DROP_TABLES].sort((a, b) => a.bossName.localeCompare(b.bossName)).map((boss) => (
                <option key={boss.bossName} value={boss.bossName}>
                  {boss.bossName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Kills / Hour</label>
            <input
              type="number"
              min={1}
              value={killsPerHour}
              onChange={(e) => setKillsPerHour(Math.max(1, Number(e.target.value)))}
              disabled={!selectedBoss}
              className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 overflow-hidden">
        {!selectedBoss ? (
          !wikiFallbackBoss || wikiFallbackLoading || effectiveRows.length > 0 ? null : (
            <EmptyState
              title="No boss selected"
              description="Select a supported boss to view expected loot value."
            />
          )
        ) : null}
        {selectedBoss || wikiFallbackBoss ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary text-xs">
                <th scope="col" className="text-left px-4 py-2">Item</th>
                <th scope="col" className="text-right px-4 py-2">Rate</th>
                <th scope="col" className="text-right px-4 py-2">Qty</th>
                <th scope="col" className="text-right px-4 py-2">GE Price</th>
                <th scope="col" className="text-right px-4 py-2">GP/Kill</th>
                <th scope="col" className="text-right px-4 py-2">GP/Hr</th>
              </tr>
            </thead>
            <tbody>
              {effectiveRows.map((row) => (
                <tr
                  key={`${row.itemId}-${row.itemName}`}
                  className="border-b border-border/50 hover:bg-bg-tertiary/50"
                >
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <WikiImage src={itemIcon(row.itemName)} alt="" className="w-5 h-5" fallback={row.itemName[0]} />
                      <ItemTooltip itemName={row.itemName}>
                        <span className={`cursor-default ${categoryColor(row.category)}`}>{row.itemName}</span>
                      </ItemTooltip>
                    </div>
                  </td>
                  <td className="text-right px-4 py-2 text-text-secondary">
                    {row.rate === 1 ? "Always" : row.rate != null ? `1/${row.rate.toLocaleString()}` : "\u2014"}
                  </td>
                  <td className="text-right px-4 py-2">{row.quantity ?? "\u2014"}</td>
                  <td className="text-right px-4 py-2">
                    {priceLoading || wikiFallbackLoading || wikiDropsLoading ? "..." : formatGp(row.gePrice)}
                  </td>
                  <td className="text-right px-4 py-2 text-success">
                    {priceLoading || wikiFallbackLoading || wikiDropsLoading ? "..." : formatGp(row.evPerKill != null ? Math.round(row.evPerKill) : null)}
                  </td>
                  <td className="text-right px-4 py-2 text-success">
                    {priceLoading || wikiFallbackLoading || wikiDropsLoading ? "..." : formatGp(row.evPerHr != null ? Math.round(row.evPerHr) : null)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-semibold">
                <td className="px-4 py-2" colSpan={4}>Total Expected Value</td>
                <td className="text-right px-4 py-2 text-success">
                  {priceLoading || wikiFallbackLoading || wikiDropsLoading ? "..." : formatGp(Math.round(totalGpPerKill))}
                </td>
                <td className="text-right px-4 py-2 text-success">
                  {priceLoading || wikiFallbackLoading || wikiDropsLoading ? "..." : formatGp(Math.round(totalGpPerHr))}
                </td>
              </tr>
            </tfoot>
          </table>
        ) : null}
      </div>
    </>
  );
}

// --- Main Loot component ---

export default function Loot() {
  const { params, navigate } = useNavigation();
  const [tab, setTab] = useState<LootTab>(
    params.tab === "profit" ? "profit" : params.tab === "ranking" ? "ranking" : "drops"
  );
  const [prices, setPrices] = useState<Record<string, ItemPrice>>({});
  const [mapping, setMapping] = useState<ItemMapping[]>([]);
  const [itemMap, setItemMap] = useState<Map<string, number>>(new Map());
  const [iconMap, setIconMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchLatestPrices(), fetchMapping()])
      .then(([p, m]) => {
        if (cancelled) return;
        setPrices(p);
        setMapping(m);
        const nameToId = new Map<string, number>();
        const nameToIcon = new Map<string, string>();
        for (const item of m) {
          nameToId.set(item.name.toLowerCase(), item.id);
          if (item.icon) nameToIcon.set(item.name.toLowerCase(), item.icon);
        }
        setItemMap(nameToId);
        setIconMap(nameToIcon);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="max-w-5xl">
      <div className="space-y-1 mb-5">
        <h2 className="text-2xl font-semibold tracking-tight">Loot & Drops</h2>
        <p className="max-w-2xl text-sm text-text-secondary">
          Search any monster's drop table, calculate boss profit, and compare GP/hr across all bosses.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {LOOT_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`relative rounded-xl border px-3.5 py-2 text-left transition ${
              tab === t.id
                ? "border-accent/50 bg-accent/10"
                : "border-border bg-bg-primary/50 text-text-secondary hover:border-border hover:bg-bg-primary/70"
            }`}
          >
            {tab === t.id && (
              <div className="absolute -bottom-px left-3 right-3 h-0.5 rounded-full bg-accent" />
            )}
            <div className={`text-xs font-semibold ${tab === t.id ? "text-accent" : ""}`}>
              {t.label}
            </div>
            <div className={`hidden sm:block text-[11px] ${tab === t.id ? "text-accent/60" : "text-text-secondary/60"}`}>
              {t.description}
            </div>
          </button>
        ))}
      </div>

      {tab === "drops" ? (
        <DropTablesTab
          prices={prices}
          itemMap={itemMap}
          iconMap={iconMap}
          navigate={navigate}
          initialMonster={params.monster}
        />
      ) : tab === "profit" ? (
        <ProfitCalculatorTab
          prices={prices}
          mapping={mapping}
          loading={loading}
          navigate={navigate}
          initialBoss={params.boss}
        />
      ) : (
        <BossProfitRanking navigate={navigate} />
      )}
    </div>
  );
}
