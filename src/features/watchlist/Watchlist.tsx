import { useState, useEffect } from "react";
import { useWatchlist } from "../../hooks/useWatchlist";
import { searchItems, type ItemMapping } from "../../lib/api/ge";
import { useDebounce } from "../../hooks/useDebounce";
import { formatGp } from "../../lib/format";

function ThresholdCell({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  if (editing) {
    return (
      <input
        type="number"
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          const num = parseInt(draft, 10);
          onChange(isNaN(num) ? null : num);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-20 bg-bg-primary border border-border rounded px-2 py-0.5 text-xs text-right"
      />
    );
  }

  return (
    <button
      onClick={() => {
        setDraft(value != null ? String(value) : "");
        setEditing(true);
      }}
      className="text-xs text-text-secondary hover:text-text-primary transition-colors"
    >
      {value != null ? formatGp(value) : "Set"}
    </button>
  );
}

export default function Watchlist() {
  const { items, prices, addItem, removeItem, updateThreshold } = useWatchlist();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);
  const [results, setResults] = useState<ItemMapping[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear results when query is too short
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    searchItems(debouncedQuery)
      .then((r) => { if (!cancelled) { setResults(r.slice(0, 10)); setSearching(false); } })
      .catch(() => { if (!cancelled) setSearching(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-4">Price Watchlist</h2>

      <div className="relative mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items to watch..."
          className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm"
        />
        {searching && (
          <p className="text-xs text-text-secondary mt-1">Searching...</p>
        )}
        {results.length > 0 && query.length >= 2 && (
          <div className="absolute z-10 mt-1 w-full bg-bg-secondary border border-border rounded-lg shadow-lg overflow-hidden">
            {results.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  addItem(item.id, item.name);
                  setQuery("");
                  setResults([]);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-bg-tertiary transition-colors flex items-center justify-between"
              >
                <span>{item.name}</span>
                {items.some((w) => w.itemId === item.id) && (
                  <span className="text-xs text-text-secondary">Watching</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          <p className="text-sm">No items on your watchlist yet.</p>
          <p className="text-xs mt-1">Search above to add items and set price alerts.</p>
        </div>
      ) : (
        <div className="bg-bg-secondary rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary text-xs">
                <th className="text-left px-4 py-2">Item</th>
                <th className="text-right px-4 py-2">Price</th>
                <th className="text-right px-4 py-2">Alert High</th>
                <th className="text-right px-4 py-2">Alert Low</th>
                <th className="text-center px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const price = prices[String(item.itemId)];
                const current = price?.high ?? price?.low ?? null;
                const highTriggered = item.thresholdHigh != null && current != null && current >= item.thresholdHigh;
                const lowTriggered = item.thresholdLow != null && current != null && current <= item.thresholdLow;
                const triggered = highTriggered || lowTriggered;

                return (
                  <tr
                    key={item.itemId}
                    className={`border-b border-border/50 even:bg-bg-primary/30 transition-colors ${triggered ? "bg-accent/5" : ""}`}
                  >
                    <td className="px-4 py-2 font-medium">{item.itemName}</td>
                    <td className="px-4 py-2 text-right">
                      {current != null ? formatGp(current) : "..."}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <ThresholdCell
                        value={item.thresholdHigh}
                        onChange={(v) => updateThreshold(item.itemId, "thresholdHigh", v)}
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <ThresholdCell
                        value={item.thresholdLow}
                        onChange={(v) => updateThreshold(item.itemId, "thresholdLow", v)}
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      {triggered ? (
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium animate-pulse ${highTriggered ? "bg-success/20 text-success" : "bg-danger/20 text-danger"}`}>
                          Triggered
                        </span>
                      ) : (
                        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary">
                          Watching
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => removeItem(item.itemId)}
                        className="text-text-secondary hover:text-danger transition-colors text-xs"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
