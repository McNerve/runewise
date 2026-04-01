import { useState, useEffect, useMemo } from "react";
import { BOSS_DROP_TABLES, type BossDropTable } from "../../lib/data/boss-drops";
import { fetchLatestPrices, fetchMapping, type ItemPrice, type ItemMapping } from "../../lib/api/ge";
import { formatGp } from "../../lib/format";
import { itemIcon } from "../../lib/sprites";

interface DropRow {
  itemName: string;
  itemId: number;
  rate: number;
  quantity: number;
  category: "unique" | "rare" | "common";
  gePrice: number | null;
  evPerKill: number | null;
  evPerHr: number | null;
}

export default function BossLootCalculator() {
  const [selectedBoss, setSelectedBoss] = useState<BossDropTable>(BOSS_DROP_TABLES[0]);
  const [killsPerHour, setKillsPerHour] = useState(BOSS_DROP_TABLES[0].killsPerHour);
  const [prices, setPrices] = useState<Record<string, ItemPrice>>({});
  const [mapping, setMapping] = useState<ItemMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [p, m] = await Promise.all([fetchLatestPrices(), fetchMapping()]);
        if (!cancelled) {
          setPrices(p);
          setMapping(m);
        }
      } catch {
        if (!cancelled) setError("Failed to load price data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

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

  const getItemName = (itemId: number, fallback: string): string => {
    return mappingById.get(itemId)?.name ?? fallback;
  };

  const rows: DropRow[] = useMemo(() => {
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

  const totalGpPerKill = rows.reduce((sum, r) => sum + (r.evPerKill ?? 0), 0);
  const totalGpPerHr = rows.reduce((sum, r) => sum + (r.evPerHr ?? 0), 0);

  const handleBossChange = (bossName: string) => {
    const boss = BOSS_DROP_TABLES.find((b) => b.bossName === bossName);
    if (!boss) return;
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

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-semibold mb-4">Boss Loot Calculator</h2>

      {error && <p className="text-xs text-danger mb-2">{error}</p>}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-bg-secondary rounded-lg p-4 text-center">
          <div className="text-xs text-text-secondary mb-1">Expected GP / Kill</div>
          <div className="text-2xl font-bold text-success">
            {loading ? "..." : formatGp(Math.round(totalGpPerKill))}
          </div>
        </div>
        <div className="bg-bg-secondary rounded-lg p-4 text-center">
          <div className="text-xs text-text-secondary mb-1">Expected GP / Hour</div>
          <div className="text-2xl font-bold text-success">
            {loading ? "..." : formatGp(Math.round(totalGpPerHr))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-bg-secondary rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-secondary mb-1">Boss</label>
            <select
              value={selectedBoss.bossName}
              onChange={(e) => handleBossChange(e.target.value)}
              className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
            >
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
              className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Drop table */}
      <div className="bg-bg-secondary rounded-lg overflow-hidden">
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
            {rows.map((row) => (
              <tr
                key={`${row.itemId}-${row.itemName}`}
                className="border-b border-border/50 hover:bg-bg-tertiary/50"
              >
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={itemIcon(row.itemName)}
                      alt=""
                      className="w-5 h-5"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    <span className={categoryColor(row.category)}>{row.itemName}</span>
                  </div>
                </td>
                <td className="text-right px-4 py-2 text-text-secondary">
                  {row.rate === 1 ? "Always" : `1/${row.rate.toLocaleString()}`}
                </td>
                <td className="text-right px-4 py-2">{row.quantity}</td>
                <td className="text-right px-4 py-2">
                  {loading ? "..." : formatGp(row.gePrice)}
                </td>
                <td className="text-right px-4 py-2 text-success">
                  {loading ? "..." : formatGp(row.evPerKill != null ? Math.round(row.evPerKill) : null)}
                </td>
                <td className="text-right px-4 py-2 text-success">
                  {loading ? "..." : formatGp(row.evPerHr != null ? Math.round(row.evPerHr) : null)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border font-semibold">
              <td className="px-4 py-2" colSpan={4}>Total Expected Value</td>
              <td className="text-right px-4 py-2 text-success">
                {loading ? "..." : formatGp(Math.round(totalGpPerKill))}
              </td>
              <td className="text-right px-4 py-2 text-success">
                {loading ? "..." : formatGp(Math.round(totalGpPerHr))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
