import { useState, useEffect, useMemo } from "react";
import {
  fetchMapping,
  fetchLatestPrices,
  type ItemMapping,
  type ItemPrice,
} from "../../lib/api/ge";
import { formatGp } from "../../lib/format";

export default function ItemDatabase() {
  const [items, setItems] = useState<ItemMapping[]>([]);
  const [prices, setPrices] = useState<Record<string, ItemPrice>>({});
  const [query, setQuery] = useState("");
  const [membersFilter, setMembersFilter] = useState<"all" | "f2p" | "p2p">(
    "all"
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMapping(), fetchLatestPrices()]).then(
      ([mapping, priceData]) => {
        if (cancelled) return;
        setItems(mapping);
        setPrices(priceData);
        setLoading(false);
      }
    );
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let result = items;
    if (query.length >= 2) {
      const q = query.toLowerCase();
      result = result.filter((item) => item.name.toLowerCase().includes(q));
    }
    if (membersFilter === "f2p") result = result.filter((i) => !i.members);
    if (membersFilter === "p2p") result = result.filter((i) => i.members);
    return result.slice(0, 100);
  }, [items, query, membersFilter]);

  if (loading) {
    return (
      <div className="text-text-secondary text-sm">
        Loading item database ({items.length > 0 ? items.length : "..."} items)...
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-semibold mb-4">
        Item Database{" "}
        <span className="text-sm font-normal text-text-secondary">
          ({items.length.toLocaleString()} items)
        </span>
      </h2>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items..."
          className="flex-1 bg-bg-secondary border border-border rounded-lg px-4 py-2 text-sm"
        />
        <div className="flex gap-1">
          {(["all", "f2p", "p2p"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setMembersFilter(f)}
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
      </div>

      {query.length < 2 && (
        <p className="text-sm text-text-secondary mb-4">
          Type at least 2 characters to search.
        </p>
      )}

      {filtered.length > 0 && (
        <div className="bg-bg-secondary rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary text-xs">
                <th className="text-left px-4 py-2">Item</th>
                <th className="text-right px-4 py-2">GE Price</th>
                <th className="text-right px-4 py-2">High Alch</th>
                <th className="text-right px-4 py-2">Value</th>
                <th className="text-right px-4 py-2">Limit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const price = prices[String(item.id)];
                return (
                  <tr
                    key={item.id}
                    className="border-b border-border/50 even:bg-bg-primary/30 hover:bg-bg-tertiary transition-colors group"
                  >
                    <td className="px-4 py-2">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-text-secondary hidden group-hover:block">
                        {item.examine}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right text-success">
                      {formatGp(price?.high ?? null)}
                    </td>
                    <td className="px-4 py-2 text-right text-warning">
                      {formatGp(item.highalch)}
                    </td>
                    <td className="px-4 py-2 text-right text-text-secondary">
                      {formatGp(item.value)}
                    </td>
                    <td className="px-4 py-2 text-right text-text-secondary">
                      {item.limit ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length >= 100 && (
            <p className="text-xs text-text-secondary text-center py-2">
              Showing first 100 results. Refine your search.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
