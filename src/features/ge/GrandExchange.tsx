import { useState, useEffect, useCallback } from "react";
import {
  searchItems,
  fetchLatestPrices,
  type ItemMapping,
  type ItemPrice,
} from "../../lib/api/ge";
import { useDebounce } from "../../hooks/useDebounce";
import { formatGp, timeAgo } from "../../lib/format";
import { useNavigation } from "../../lib/NavigationContext";

export default function GrandExchange() {
  const { params } = useNavigation();
  const [query, setQuery] = useState(params.query ?? "");
  const debouncedQuery = useDebounce(query, 250);
  const [results, setResults] = useState<ItemMapping[]>([]);
  const [prices, setPrices] = useState<Record<string, ItemPrice>>({});
  const [loading, setLoading] = useState(false);
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPrices = useCallback(() => {
    setPricesLoaded(false);
    setError(null);
    let cancelled = false;
    fetchLatestPrices()
      .then((p) => {
        if (!cancelled) {
          setPrices(p);
          setPricesLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load prices. Try again later.");
          setPricesLoaded(true);
        }
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial price load
    return loadPrices();
  }, [loadPrices]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear results when query is too short
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchItems(debouncedQuery)
      .then((items) => {
        if (!cancelled) {
          setResults(items);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setError("Search failed. Try again.");
        }
      });
    return () => { cancelled = true; };
  }, [debouncedQuery]);


  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">Grand Exchange</h2>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search items..."
        className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm mb-4"
      />

      {error && (
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs text-danger">{error}</p>
          <button
            onClick={loadPrices}
            className="text-xs text-accent hover:text-accent-hover transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!pricesLoaded && (
        <p className="text-xs text-text-secondary">Loading prices...</p>
      )}

      {loading && <p className="text-xs text-text-secondary">Searching...</p>}

      {results.length > 0 && (
        <div className="bg-bg-secondary rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary text-xs">
                <th className="text-left px-4 py-2">Item</th>
                <th className="text-right px-4 py-2">Buy</th>
                <th className="text-right px-4 py-2">Sell</th>
                <th className="text-right px-4 py-2">Margin</th>
                <th className="text-right px-4 py-2">High Alch</th>
                <th className="text-right px-4 py-2">Limit</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item) => {
                const price = prices[String(item.id)];
                return (
                  <tr
                    key={item.id}
                    className="border-b border-border/50 hover:bg-bg-tertiary transition-colors"
                  >
                    <td className="px-4 py-2">
                      <div className="font-medium">{item.name}</div>
                      {item.members && (
                        <span className="text-xs text-warning">P2P</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="text-success">
                        {formatGp(price?.high ?? null)}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {timeAgo(price?.highTime ?? null)}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="text-danger">
                        {formatGp(price?.low ?? null)}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {timeAgo(price?.lowTime ?? null)}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {(() => {
                        const margin =
                          price?.high != null && price?.low != null
                            ? price.high - price.low
                            : null;
                        if (margin == null) return "—";
                        return (
                          <span
                            className={
                              margin > 0 ? "text-success" : "text-danger"
                            }
                          >
                            {margin > 0 ? "+" : ""}
                            {formatGp(margin)}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-2 text-right text-warning">
                      {formatGp(item.highalch)}
                    </td>
                    <td className="px-4 py-2 text-right text-text-secondary">
                      {item.limit ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {query.length >= 2 && !loading && results.length === 0 && (
        <p className="text-sm text-text-secondary text-center py-4">
          No items found for "{query}"
        </p>
      )}
    </div>
  );
}
