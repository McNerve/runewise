import { useState, useMemo } from "react";
import type { ItemMapping, ItemPrice } from "../../../lib/api/ge";
import { formatGp } from "../../../lib/format";
import { itemIcon } from "../../../lib/sprites";

interface BulkSearchProps {
  mapping: ItemMapping[];
  prices: Record<string, ItemPrice>;
}

interface BulkResult {
  item: ItemMapping;
  price: ItemPrice | null;
}

export default function BulkSearch({ mapping, prices }: BulkSearchProps) {
  const [input, setInput] = useState("");

  const nameMap = useMemo(() => {
    const map = new Map<string, ItemMapping>();
    for (const item of mapping) {
      map.set(item.name.toLowerCase(), item);
    }
    return map;
  }, [mapping]);

  const results = useMemo<BulkResult[]>(() => {
    if (!input.trim()) return [];
    const names = input
      .split(/[,\n]+/)
      .map((n) => n.trim())
      .filter(Boolean);

    return names.map((name) => {
      const lower = name.toLowerCase();
      const exact = nameMap.get(lower);
      if (exact) {
        return { item: exact, price: prices[String(exact.id)] ?? null };
      }
      // Fuzzy match
      const match = mapping.find((m) =>
        m.name.toLowerCase().includes(lower)
      );
      if (match) {
        return { item: match, price: prices[String(match.id)] ?? null };
      }
      return {
        item: { id: 0, name, examine: "", members: true, lowalch: 0, highalch: 0, limit: 0, value: 0, icon: "" },
        price: null,
      };
    });
  }, [input, nameMap, mapping, prices]);

  const totalValue = useMemo(
    () =>
      results.reduce(
        (sum, r) => sum + (r.price?.high ?? r.price?.low ?? 0),
        0
      ),
    [results]
  );

  return (
    <div>
      <div className="section-kicker mb-2">Bulk Price Lookup</div>
      <p className="text-xs text-text-secondary/60 mb-3">
        Paste a list of item names (comma or newline separated) to see all prices at once.
      </p>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={"Twisted bow\nScythe of vitur\nTumeken's shadow\nOsmumten's fang"}
        rows={4}
        className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm resize-y mb-4"
      />

      {results.length > 0 && (
        <div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-2 text-xs text-text-secondary font-normal w-8" />
                <th className="px-2 py-2 text-xs text-text-secondary font-normal">Item</th>
                <th className="px-2 py-2 text-xs text-text-secondary font-normal text-right">Buy</th>
                <th className="px-2 py-2 text-xs text-text-secondary font-normal text-right">Sell</th>
                <th className="px-2 py-2 text-xs text-text-secondary font-normal text-right">Margin</th>
                <th className="px-2 py-2 text-xs text-text-secondary font-normal text-right">High Alch</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const margin =
                  r.price?.high != null && r.price?.low != null
                    ? r.price.high - r.price.low
                    : null;
                return (
                  <tr
                    key={`${r.item.name}-${i}`}
                    className="border-b border-border/30 hover:bg-bg-secondary/30"
                  >
                    <td className="px-2 py-1.5">
                      <img
                        src={itemIcon(r.item.name)}
                        alt=""
                        className="w-5 h-5"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-sm">
                      {r.item.name}
                      {r.item.id === 0 && (
                        <span className="ml-1 text-danger text-xs">Not found</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-xs text-right tabular-nums text-text-secondary">
                      {r.price?.high != null ? formatGp(r.price.high) : "—"}
                    </td>
                    <td className="px-2 py-1.5 text-xs text-right tabular-nums text-text-secondary">
                      {r.price?.low != null ? formatGp(r.price.low) : "—"}
                    </td>
                    <td className={`px-2 py-1.5 text-xs text-right tabular-nums ${
                      margin != null && margin > 0 ? "text-success" : "text-text-secondary"
                    }`}>
                      {margin != null ? formatGp(margin) : "—"}
                    </td>
                    <td className="px-2 py-1.5 text-xs text-right tabular-nums text-text-secondary">
                      {r.item.highalch > 0 ? formatGp(r.item.highalch) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border">
                <td colSpan={2} className="px-2 py-2 text-xs text-text-secondary font-medium">
                  Total ({results.length} items)
                </td>
                <td className="px-2 py-2 text-xs text-right tabular-nums font-medium">
                  {formatGp(totalValue)}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
