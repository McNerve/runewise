import { useState, useEffect, useMemo } from "react";
import { BOSS_DROP_TABLES, type BossDropTable } from "../../lib/data/boss-drops";
import type { ItemMapping } from "../../lib/api/ge";
import { useGEData } from "../../hooks/useGEData";
import { fetchDropTable, type DropItem } from "../../lib/api/wiki";
import { formatGp } from "../../lib/format";
import { itemIcon } from "../../lib/sprites";
import { useNavigation } from "../../lib/NavigationContext";
import { findBossByName, normalizeBossLookup } from "../../lib/data/bosses";
import WikiImage from "../../components/WikiImage";

interface DropRow {
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

export default function BossLootCalculator() {
  const { params, navigate } = useNavigation();
  const { mapping, prices, loading, fetchIfNeeded } = useGEData();
  const [selectedBoss, setSelectedBoss] = useState<BossDropTable | null>(BOSS_DROP_TABLES[0]);
  const [killsPerHour, setKillsPerHour] = useState(BOSS_DROP_TABLES[0].killsPerHour);
  const [error] = useState<string | null>(null);
  const [unsupportedBoss, setUnsupportedBoss] = useState<string | null>(null);
  const [wikiFallbackBoss, setWikiFallbackBoss] = useState<string | null>(null);
  const [wikiDropCategories, setWikiDropCategories] = useState<{ name: string; drops: DropItem[] }[]>([]);
  const [wikiFallbackLoading, setWikiFallbackLoading] = useState(false);

  useEffect(() => { fetchIfNeeded(); }, [fetchIfNeeded]);

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

  const rows: DropRow[] = useMemo(() => {
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

  const wikiRows: DropRow[] = useMemo(() => {
    return wikiDropCategories
      .flatMap((category) => category.drops)
      .map((drop) => {
        const mappedItem = mappingByName.get(drop.name.toLowerCase()) ?? null;
        const itemId = mappedItem?.id ?? null;
        const rate = parseRate(drop.rarity);
        const quantity = parseQuantity(drop.quantity);
        const gePrice = itemId != null ? getPrice(itemId) : null;
        const lowerCategory = drop.category.toLowerCase();
        const categoryType: DropRow["category"] = lowerCategory.includes("unique")
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
    if (!params.boss) return;
    let cancelled = false;
    const routedBoss = findBossByName(params.boss) ?? { name: params.boss };
    const nextBoss = BOSS_DROP_TABLES.find(
      (boss) =>
        normalizeBossLookup(boss.bossName) ===
        normalizeBossLookup(routedBoss.name)
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
  }, [params.boss, selectedBoss?.bossName]);

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Boss Loot Calculator</h2>
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
            className="rounded-xl border border-border bg-bg-tertiary px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-accent/35 hover:text-text-primary"
          >
            Open Boss Workspace
          </button>
        ) : null}
      </div>

      {error && <p className="text-xs text-danger mb-2">{error}</p>}
      {unsupportedBoss ? (
        <div className="mb-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-text-primary">
          <div className="font-medium">No curated loot calculator yet for {unsupportedBoss}</div>
          <div className="mt-1 text-xs text-text-secondary">
            RuneWise can still show wiki drops for this boss in Boss Guides, but the standalone calculator only supports curated bosses and non-raid bosses with parseable wiki drop data so far.
          </div>
        </div>
      ) : null}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center">
          <div className="text-xs text-text-secondary mb-1">Expected GP / Kill</div>
          <div className="text-2xl font-bold text-success">
            {loading || wikiFallbackLoading ? "..." : formatGp(Math.round(totalGpPerKill))}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-text-secondary mb-1">Expected GP / Hour</div>
          <div className="text-2xl font-bold text-success">
            {loading || wikiFallbackLoading ? "..." : formatGp(Math.round(totalGpPerHr))}
          </div>
        </div>
      </div>

      {/* Controls */}
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

      {/* Drop table */}
      <div className="overflow-hidden">
        {!selectedBoss ? (
          !wikiFallbackBoss || wikiFallbackLoading || effectiveRows.length > 0 ? null : (
            <div className="px-4 py-8 text-center text-sm text-text-secondary">
              Select a supported boss to view expected loot value.
            </div>
          )
        ) : (
        null)}
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
                    <WikiImage
                      src={itemIcon(row.itemName)}
                      alt=""
                      className="w-5 h-5"
                      fallback={row.itemName[0]}
                    />
                    <span className={categoryColor(row.category)}>{row.itemName}</span>
                  </div>
                </td>
                <td className="text-right px-4 py-2 text-text-secondary">
                  {row.rate === 1 ? "Always" : row.rate != null ? `1/${row.rate.toLocaleString()}` : "—"}
                </td>
                <td className="text-right px-4 py-2">{row.quantity ?? "—"}</td>
                <td className="text-right px-4 py-2">
                  {loading || wikiFallbackLoading ? "..." : formatGp(row.gePrice)}
                </td>
                <td className="text-right px-4 py-2 text-success">
                  {loading || wikiFallbackLoading ? "..." : formatGp(row.evPerKill != null ? Math.round(row.evPerKill) : null)}
                </td>
                <td className="text-right px-4 py-2 text-success">
                  {loading || wikiFallbackLoading ? "..." : formatGp(row.evPerHr != null ? Math.round(row.evPerHr) : null)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border font-semibold">
              <td className="px-4 py-2" colSpan={4}>Total Expected Value</td>
              <td className="text-right px-4 py-2 text-success">
                {loading || wikiFallbackLoading ? "..." : formatGp(Math.round(totalGpPerKill))}
              </td>
              <td className="text-right px-4 py-2 text-success">
                {loading || wikiFallbackLoading ? "..." : formatGp(Math.round(totalGpPerHr))}
              </td>
            </tr>
          </tfoot>
        </table>
        ) : null}
      </div>
    </div>
  );
}
