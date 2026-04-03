import { useState, useMemo } from "react";
import type { WikiDrop } from "../lib/api/drops";
import { formatGp } from "../lib/format";
import { itemIcon } from "../lib/sprites";
import { useNavigation } from "../lib/NavigationContext";
import WikiImage from "./WikiImage";
import ItemTooltip from "./ItemTooltip";

interface DropTableProps {
  drops: WikiDrop[];
  prices?: Record<string, { high: number | null; low: number | null }>;
  itemMap?: Map<string, number>;
  iconMap?: Map<string, string>;
  killsPerHour?: number;
  onKillsPerHourChange?: (v: number) => void;
  showProfit?: boolean;
}

type SortKey = "name" | "rarity" | "value";

function parseFractionFallback(rarity: string): number | null {
  if (!rarity) return null;
  if (rarity.toLowerCase() === "always") return 1;
  const cleaned = rarity.replace(/~/g, "").replace(/,/g, "");
  const match = cleaned.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (match) {
    const num = parseFloat(match[1]);
    const den = parseFloat(match[2]);
    if (den > 0) return num / den;
  }
  return null;
}

function RarityBar({ fraction, rarity }: { fraction: number | null; rarity?: string }) {
  const effective = fraction ?? (rarity ? parseFractionFallback(rarity) : null);
  if (effective == null || effective <= 0) return null;
  const rate = 1 / effective;
  const width = Math.max(5, Math.min(100, effective * 5000));
  const color =
    rate <= 16
      ? "bg-text-secondary"
      : rate <= 128
        ? "bg-accent"
        : rate <= 512
          ? "bg-warning"
          : "bg-danger";
  return (
    <div className="w-full bg-bg-tertiary rounded-full h-1.5 mt-0.5">
      <div className={`rounded-full h-1.5 ${color}`} style={{ width: `${width}%` }} />
    </div>
  );
}

function getItemPrice(
  itemName: string,
  prices?: Record<string, { high: number | null; low: number | null }>,
  itemMap?: Map<string, number>
): number | null {
  if (!prices || !itemMap) return null;
  const id = itemMap.get(itemName.toLowerCase());
  if (!id) return null;
  const p = prices[String(id)];
  return p?.high ?? p?.low ?? null;
}

export default function DropTable({
  drops,
  prices,
  itemMap,
  iconMap,
  killsPerHour,
  onKillsPerHourChange,
  showProfit = false,
}: DropTableProps) {
  const { navigate } = useNavigation();

  const getIconUrl = (name: string) => {
    const icon = iconMap?.get(name.toLowerCase());
    return icon ? `https://oldschool.runescape.wiki/images/${icon}` : itemIcon(name);
  };
  const [sortKey, setSortKey] = useState<SortKey>("rarity");
  const [sortAsc, setSortAsc] = useState(true);
  // Auto-expand all categories by building the set from the data
  const allCategoryNames = useMemo(() => {
    const names = new Set<string>();
    for (const drop of drops) {
      names.add(drop.isRareDropTable ? "Rare drop table" : (drop.dropType || "Other"));
    }
    return names;
  }, [drops]);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const effectiveExpanded = expandedCategories.size > 0 ? expandedCategories : allCategoryNames;

  const categories = useMemo(() => {
    const grouped = new Map<string, WikiDrop[]>();
    for (const drop of drops) {
      const cat = drop.isRareDropTable ? "Rare drop table" : (drop.dropType || "Other");
      const list = grouped.get(cat) ?? [];
      list.push(drop);
      grouped.set(cat, list);
    }

    for (const [cat, items] of grouped) {
      items.sort((a, b) => {
        if (sortKey === "name") {
          const cmp = a.itemName.localeCompare(b.itemName);
          return sortAsc ? cmp : -cmp;
        }
        if (sortKey === "rarity") {
          const aRate = a.rarityFraction ?? 0;
          const bRate = b.rarityFraction ?? 0;
          return sortAsc ? bRate - aRate : aRate - bRate;
        }
        // value
        const aPrice = getItemPrice(a.itemName, prices, itemMap) ?? 0;
        const bPrice = getItemPrice(b.itemName, prices, itemMap) ?? 0;
        const aVal = aPrice * ((a.quantityLow + a.quantityHigh) / 2) * (a.rarityFraction ?? 0);
        const bVal = bPrice * ((b.quantityLow + b.quantityHigh) / 2) * (b.rarityFraction ?? 0);
        return sortAsc ? aVal - bVal : bVal - aVal;
      });
      grouped.set(cat, items);
    }

    return grouped;
  }, [drops, sortKey, sortAsc, prices, itemMap]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(key === "rarity");
    }
  }

  function toggleCategory(cat: string) {
    setExpandedCategories((prev) => {
      // First toggle: initialize from all categories (all expanded), then collapse the clicked one
      const base = prev.size > 0 ? prev : allCategoryNames;
      const next = new Set(base);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  if (drops.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        No drop data available
      </div>
    );
  }

  return (
    <div>
      {showProfit && onKillsPerHourChange && (
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs text-text-secondary">Kills/hr:</span>
          <input
            type="number"
            min={1}
            max={200}
            value={killsPerHour ?? 20}
            onChange={(e) => onKillsPerHourChange(Math.max(1, Number(e.target.value)))}
            className="w-20 bg-bg-tertiary border border-border rounded px-2 py-1 text-sm tabular-nums"
          />
        </div>
      )}

      {[...categories.entries()].map(([catName, items]) => (
        <div key={catName} className="mb-3">
          <button
            onClick={() => toggleCategory(catName)}
            className="flex items-center gap-2 w-full text-left py-1.5"
          >
            <span className="text-xs text-text-secondary/50">
              {effectiveExpanded.has(catName) ? "▾" : "▸"}
            </span>
            <span className="text-xs font-medium text-text-secondary">
              {catName}
            </span>
            <span className="text-xs text-text-secondary/40">
              ({items.length})
            </span>
          </button>

          {effectiveExpanded.has(catName) && (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="px-2 py-1.5 text-xs text-text-secondary/60 font-normal w-6" />
                  <th
                    className="px-2 py-1.5 text-xs text-text-secondary/60 font-normal cursor-pointer hover:text-text-primary"
                    onClick={() => handleSort("name")}
                  >
                    Item {sortKey === "name" && (sortAsc ? "↑" : "↓")}
                  </th>
                  <th className="px-2 py-1.5 text-xs text-text-secondary/60 font-normal text-right w-16">Qty</th>
                  <th
                    className="px-2 py-1.5 text-xs text-text-secondary/60 font-normal text-right cursor-pointer hover:text-text-primary w-28"
                    onClick={() => handleSort("rarity")}
                  >
                    Rate {sortKey === "rarity" && (sortAsc ? "↑" : "↓")}
                  </th>
                  {prices && (
                    <th
                      className="px-2 py-1.5 text-xs text-text-secondary/60 font-normal text-right cursor-pointer hover:text-text-primary w-20"
                      onClick={() => handleSort("value")}
                    >
                      Price {sortKey === "value" && (sortAsc ? "↑" : "↓")}
                    </th>
                  )}
                  {showProfit && prices && (
                    <>
                      <th className="px-2 py-1.5 text-xs text-text-secondary/60 font-normal text-right w-20">GP/Kill</th>
                      {killsPerHour && (
                        <th className="px-2 py-1.5 text-xs text-text-secondary/60 font-normal text-right w-20">GP/Hr</th>
                      )}
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((drop, i) => {
                  const price = getItemPrice(drop.itemName, prices, itemMap);
                  const avgQty = (drop.quantityLow + drop.quantityHigh) / 2;
                  const gpPerKill = price && drop.rarityFraction
                    ? price * avgQty * drop.rarityFraction
                    : null;
                  const gpPerHour = gpPerKill && killsPerHour
                    ? gpPerKill * killsPerHour
                    : null;

                  return (
                    <tr
                      key={`${drop.itemName}-${i}`}
                      className="border-b border-border/15 hover:bg-bg-secondary/30 transition-colors"
                    >
                      <td className="px-2 py-1.5">
                        <WikiImage
                          src={getIconUrl(drop.itemName)}
                          alt={drop.itemName}
                          className="w-5 h-5"
                          fallback={drop.itemName[0]}
                        />
                      </td>
                      <td className="px-2 py-1.5 text-sm">
                        <ItemTooltip itemName={drop.itemName}>
                          <button
                            type="button"
                            onClick={() => navigate("wiki", { page: drop.itemName.replace(/ /g, "_") })}
                            className="text-left hover:text-accent transition-colors"
                          >
                            {drop.itemName}
                          </button>
                        </ItemTooltip>
                      </td>
                      <td className="px-2 py-1.5 text-xs text-text-secondary text-right tabular-nums">
                        {drop.quantity}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <div className="text-xs tabular-nums">
                          {drop.rarity === "Always" ? (
                            <span className="text-success">Always</span>
                          ) : (
                            <span className="text-text-secondary">{drop.rarity}</span>
                          )}
                        </div>
                        <RarityBar fraction={drop.rarityFraction} rarity={drop.rarity} />
                      </td>
                      {prices && (
                        <td className="px-2 py-1.5 text-xs text-right tabular-nums text-text-secondary">
                          {price ? formatGp(price) : "—"}
                        </td>
                      )}
                      {showProfit && prices && (
                        <>
                          <td className="px-2 py-1.5 text-xs text-right tabular-nums text-text-secondary">
                            {gpPerKill ? formatGp(Math.round(gpPerKill)) : "—"}
                          </td>
                          {killsPerHour && (
                            <td className="px-2 py-1.5 text-xs text-right tabular-nums text-text-secondary">
                              {gpPerHour ? formatGp(Math.round(gpPerHour)) : "—"}
                            </td>
                          )}
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}
