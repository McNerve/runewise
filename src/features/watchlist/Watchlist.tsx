import { useState, useEffect } from "react";
import { useWatchlist } from "../../hooks/useWatchlist";
import { searchItems, type ItemMapping } from "../../lib/api/ge";
import { useDebounce } from "../../hooks/useDebounce";
import { formatGp } from "../../lib/format";
import { useNavigation } from "../../lib/NavigationContext";
import { itemIcon } from "../../lib/sprites";
import WikiImage from "../../components/WikiImage";
import EmptyState from "../../components/EmptyState";
import { parseThresholdInput } from "./helpers";

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
        type="text"
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          onChange(parseThresholdInput(draft));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setEditing(false);
        }}
        placeholder="250k"
        className="w-24 bg-bg-primary border border-border rounded px-2 py-0.5 text-xs text-right"
      />
    );
  }

  return (
    <button
      onClick={() => {
        setDraft(value != null ? String(value) : "");
        setEditing(true);
      }}
      className={`text-xs px-2 py-0.5 rounded transition-colors ${
        value != null
          ? "text-text-secondary hover:text-text-primary"
          : "text-accent border border-accent/30 hover:bg-accent/10"
      }`}
    >
      {value != null ? formatGp(value) : "Click to set"}
    </button>
  );
}

export default function Watchlist() {
  const { navigate } = useNavigation();
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

  const trackedCount = items.length;
  const triggeredCount = items.filter((item) => {
    const price = prices[String(item.itemId)];
    const current = price?.high ?? price?.low ?? null;
    return (
      (item.thresholdHigh != null && current != null && current >= item.thresholdHigh) ||
      (item.thresholdLow != null && current != null && current <= item.thresholdLow)
    );
  }).length;
  const thresholdCount = items.filter(
    (item) => item.thresholdHigh != null || item.thresholdLow != null
  ).length;

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold tracking-tight">Price Watchlist</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Monitor tracked items, set alert thresholds, and jump straight into the item workspace when something moves.
        </p>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-bg-primary/45 px-4 py-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">Tracked Items</div>
          <div className="mt-1 text-lg font-semibold text-text-primary">{trackedCount}</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-bg-primary/45 px-4 py-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">Thresholds Set</div>
          <div className="mt-1 text-lg font-semibold text-text-primary">{thresholdCount}</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-bg-primary/45 px-4 py-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">Triggered</div>
          <div className={`mt-1 text-lg font-semibold ${triggeredCount > 0 ? "text-warning" : "text-text-primary"}`}>
            {triggeredCount}
          </div>
        </div>
      </div>

      <div className="relative mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items to watch..."
          className="w-full bg-bg-tertiary border border-border rounded-lg px-4 py-2.5 text-sm"
        />
        {searching && (
          <p className="text-xs text-text-secondary mt-1">Searching...</p>
        )}
        {results.length > 0 && query.length >= 2 && (
          <div className="absolute z-10 mt-1 w-full bg-bg-tertiary border border-border rounded-lg shadow-lg overflow-hidden">
            {results.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  addItem(item.id, item.name);
                  setQuery("");
                  setResults([]);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-bg-secondary transition-colors flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <WikiImage src={itemIcon(item.name)} alt="" className="h-5 w-5 shrink-0" fallback={item.name[0]} />
                  <span>{item.name}</span>
                </span>
                {items.some((w) => w.itemId === item.id) && (
                  <span className="text-xs text-text-secondary">Watching</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No items on your watchlist yet"
          description="Search above to add items and set price alerts."
        />
      ) : (
        <div className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary text-xs">
                <th className="text-left px-4 py-2">Item</th>
                <th className="text-right px-4 py-2">Price</th>
                <th className="text-right px-4 py-2">Alert High</th>
                <th className="text-right px-4 py-2">Alert Low</th>
                <th className="text-center px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
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
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => navigate("market", { query: item.itemName })}
                        className="flex items-center gap-2 text-left transition hover:text-accent"
                      >
                        <WikiImage
                          src={itemIcon(item.itemName)}
                          alt=""
                          className="h-5 w-5 shrink-0"
                          fallback={item.itemName[0]}
                        />
                        <span className="font-medium">{item.itemName}</span>
                      </button>
                    </td>
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
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate("market", { query: item.itemName })}
                          className="text-xs text-accent transition hover:text-accent-hover"
                        >
                          Open
                        </button>
                        <span className="text-text-secondary/25">•</span>
                        <button
                          onClick={() => removeItem(item.itemId)}
                          className="text-text-secondary hover:text-danger transition-colors text-xs"
                        >
                          Remove
                        </button>
                      </div>
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
