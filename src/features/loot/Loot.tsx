import { useState, useEffect, useMemo } from "react";
import { searchMonsters, fetchDropTable, type DropItem } from "../../lib/api/wiki";
import { fetchLatestPrices, fetchMapping, type ItemPrice, type ItemMapping } from "../../lib/api/ge";
import { formatGp } from "../../lib/format";
import { itemIcon } from "../../lib/sprites";
import { useDebounce } from "../../hooks/useDebounce";
import { useNavigation } from "../../lib/NavigationContext";
import WikiImage from "../../components/WikiImage";
import { findBossByName, normalizeBossLookup } from "../../lib/data/bosses";
import { BOSS_DROP_TABLES, type BossDropTable } from "../../lib/data/boss-drops";

type LootTab = "drops" | "profit";

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
  navigate,
  initialMonster,
}: {
  prices: Record<string, ItemPrice>;
  itemMap: Map<string, number>;
  navigate: (view: string, params?: Record<string, string>) => void;
  initialMonster: string | undefined;
}) {
  const [query, setQuery] = useState(initialMonster ?? "");
  const debouncedQuery = useDebounce(query, 300);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedMonster, setSelectedMonster] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ name: string; drops: DropItem[] }[]>([]);
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
    const data = await fetchDropTable(name);
    setCategories(data.categories);
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
          placeholder="Search monsters..."
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

      {loading && <p className="text-sm text-text-secondary">Loading drop table...</p>}

      {selectedMonster && !loading && categories.length === 0 && (
        <p className="text-sm text-text-secondary">No drop table found for {selectedMonster}.</p>
      )}

      {categories.map((cat) => (
        <div key={cat.name} className="mb-4">
          <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">
            {cat.name}
          </h3>
          <div className="bg-bg-secondary rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary text-xs">
                  <th className="text-left px-4 py-2">Item</th>
                  <th className="text-right px-4 py-2">Qty</th>
                  <th className="text-right px-4 py-2">Rate</th>
                  <th className="text-right px-4 py-2">Price</th>
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
  navigate: (view: string, params?: Record<string, string>) => void;
  initialBoss: string | undefined;
}) {
  const [selectedBoss, setSelectedBoss] = useState<BossDropTable | null>(BOSS_DROP_TABLES[0]);
  const [killsPerHour, setKillsPerHour] = useState(BOSS_DROP_TABLES[0].killsPerHour);
  const [unsupportedBoss, setUnsupportedBoss] = useState<string | null>(null);
  const [wikiFallbackBoss, setWikiFallbackBoss] = useState<string | null>(null);
  const [wikiDropCategories, setWikiDropCategories] = useState<{ name: string; drops: DropItem[] }[]>([]);
  const [wikiFallbackLoading, setWikiFallbackLoading] = useState(false);

  const getPrice = (itemId: number): number | null => {
    const p = prices[String(itemId)];
    if (!p) return null;
    if (p.high != null && p.low != null) return Math.round((p.high + p.low) / 2);
    return p.high ?? p.low ?? null;
  };

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

  const getItemName = (itemId: number, fallback: string): string => {
    return mappingById.get(itemId)?.name ?? fallback;
  };

  const rows: ProfitRow[] = useMemo(() => {
    if (!selectedBoss) return [];
    return selectedBoss.drops.map((drop) => {
      const price = getPrice(drop.itemId);
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

  const effectiveRows = selectedBoss ? rows : wikiRows;
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
  };

  const categoryColor = (cat: string) => {
    switch (cat) {
      case "unique": return "text-accent";
      case "rare": return "text-warning";
      default: return "text-text-secondary";
    }
  };

  const linkedBoss = selectedBoss ? findBossByName(selectedBoss.bossName) : null;

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
      void fetchDropTable(routedBoss.name)
        .then((result) => {
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
        <div className="text-center">
          <div className="text-xs text-text-secondary mb-1">Expected GP / Kill</div>
          <div className="text-2xl font-bold text-success">
            {priceLoading || wikiFallbackLoading ? "..." : formatGp(Math.round(totalGpPerKill))}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-text-secondary mb-1">Expected GP / Hour</div>
          <div className="text-2xl font-bold text-success">
            {priceLoading || wikiFallbackLoading ? "..." : formatGp(Math.round(totalGpPerHr))}
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
              {BOSS_DROP_TABLES.map((boss) => (
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

      <div className="overflow-hidden">
        {!selectedBoss ? (
          !wikiFallbackBoss || wikiFallbackLoading || effectiveRows.length > 0 ? null : (
            <div className="px-4 py-8 text-center text-sm text-text-secondary">
              Select a supported boss to view expected loot value.
            </div>
          )
        ) : null}
        {selectedBoss || wikiFallbackBoss ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary text-xs">
                <th className="text-left px-4 py-2">Item</th>
                <th className="text-right px-4 py-2">Rate</th>
                <th className="text-right px-4 py-2">Qty</th>
                <th className="text-right px-4 py-2">GE Price</th>
                <th className="text-right px-4 py-2">GP/Kill</th>
                <th className="text-right px-4 py-2">GP/Hr</th>
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
                      <span className={categoryColor(row.category)}>{row.itemName}</span>
                    </div>
                  </td>
                  <td className="text-right px-4 py-2 text-text-secondary">
                    {row.rate === 1 ? "Always" : row.rate != null ? `1/${row.rate.toLocaleString()}` : "\u2014"}
                  </td>
                  <td className="text-right px-4 py-2">{row.quantity ?? "\u2014"}</td>
                  <td className="text-right px-4 py-2">
                    {priceLoading || wikiFallbackLoading ? "..." : formatGp(row.gePrice)}
                  </td>
                  <td className="text-right px-4 py-2 text-success">
                    {priceLoading || wikiFallbackLoading ? "..." : formatGp(row.evPerKill != null ? Math.round(row.evPerKill) : null)}
                  </td>
                  <td className="text-right px-4 py-2 text-success">
                    {priceLoading || wikiFallbackLoading ? "..." : formatGp(row.evPerHr != null ? Math.round(row.evPerHr) : null)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-semibold">
                <td className="px-4 py-2" colSpan={4}>Total Expected Value</td>
                <td className="text-right px-4 py-2 text-success">
                  {priceLoading || wikiFallbackLoading ? "..." : formatGp(Math.round(totalGpPerKill))}
                </td>
                <td className="text-right px-4 py-2 text-success">
                  {priceLoading || wikiFallbackLoading ? "..." : formatGp(Math.round(totalGpPerHr))}
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
  const [tab, setTab] = useState<LootTab>((params.tab as LootTab) === "profit" ? "profit" : "drops");
  const [prices, setPrices] = useState<Record<string, ItemPrice>>({});
  const [mapping, setMapping] = useState<ItemMapping[]>([]);
  const [itemMap, setItemMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchLatestPrices(), fetchMapping()])
      .then(([p, m]) => {
        if (cancelled) return;
        setPrices(p);
        setMapping(m);
        const nameToId = new Map<string, number>();
        for (const item of m) nameToId.set(item.name.toLowerCase(), item.id);
        setItemMap(nameToId);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-semibold mb-4">Loot</h2>

      <div className="flex bg-bg-secondary rounded-lg p-0.5 border border-border mb-4 w-fit">
        <button
          onClick={() => setTab("drops")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            tab === "drops" ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Drop Tables
        </button>
        <button
          onClick={() => setTab("profit")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            tab === "profit" ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Profit Calculator
        </button>
      </div>

      {tab === "drops" ? (
        <DropTablesTab
          prices={prices}
          itemMap={itemMap}
          navigate={navigate}
          initialMonster={params.monster}
        />
      ) : (
        <ProfitCalculatorTab
          prices={prices}
          mapping={mapping}
          loading={loading}
          navigate={navigate}
          initialBoss={params.boss}
        />
      )}
    </div>
  );
}
