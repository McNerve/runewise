import { useState, useEffect, useMemo, useCallback } from "react";
import {
  searchItems,
  fetchMapping,
  fetchLatestPrices,
  type ItemMapping,
  type ItemPrice,
} from "../../lib/api/ge";
import {
  fetchTimeseries,
  type TimeseriesPoint,
  type Timestep,
} from "../../lib/api/ge-timeseries";
import { useDebounce } from "../../hooks/useDebounce";
import { useWatchlist } from "../../hooks/useWatchlist";
import { formatGp, timeAgo } from "../../lib/format";
import { itemIcon } from "../../lib/sprites";
import Chart from "../../components/Chart";
import type {
  LineData,
  CandlestickData,
  HistogramData,
  Time,
  UTCTimestamp,
} from "lightweight-charts";

// --- Period / chart config ---

type Period = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y";
type ChartMode = "line" | "candlestick";
type Tab = "search" | "browse";

const PERIODS: Period[] = ["1D", "1W", "1M", "3M", "6M", "1Y"];

const PERIOD_TIMESTEP: Record<Period, Timestep> = {
  "1D": "5m",
  "1W": "1h",
  "1M": "6h",
  "3M": "24h",
  "6M": "24h",
  "1Y": "24h",
};

const PERIOD_SECONDS: Record<Period, number> = {
  "1D": 86400,
  "1W": 7 * 86400,
  "1M": 30 * 86400,
  "3M": 90 * 86400,
  "6M": 180 * 86400,
  "1Y": 365 * 86400,
};

// --- Chart data transforms ---

function filterByPeriod(
  points: TimeseriesPoint[],
  period: Period
): TimeseriesPoint[] {
  const cutoff = Math.floor(Date.now() / 1000) - PERIOD_SECONDS[period];
  return points.filter((p) => p.timestamp >= cutoff);
}

function toLineData(points: TimeseriesPoint[]): LineData<Time>[] {
  return points
    .filter((p) => p.avgHighPrice != null)
    .map((p) => ({
      time: p.timestamp as UTCTimestamp,
      value: p.avgHighPrice!,
    }));
}

function toCandlestickData(
  points: TimeseriesPoint[]
): CandlestickData<Time>[] {
  const result: CandlestickData<Time>[] = [];
  let prevClose: number | null = null;

  for (const p of points) {
    const high = p.avgHighPrice;
    const low = p.avgLowPrice;
    if (high == null && low == null) continue;

    const closeVal = high ?? low!;
    const openVal = prevClose ?? closeVal;
    const hiVal = Math.max(high ?? closeVal, low ?? closeVal);
    const loVal = Math.min(high ?? closeVal, low ?? closeVal);

    result.push({
      time: p.timestamp as UTCTimestamp,
      open: openVal,
      high: hiVal,
      low: loVal,
      close: closeVal,
    });

    prevClose = closeVal;
  }

  return result;
}

function toVolumeData(points: TimeseriesPoint[]): HistogramData<Time>[] {
  const result: HistogramData<Time>[] = [];
  let prevPrice: number | null = null;

  for (const p of points) {
    const vol = p.highPriceVolume + p.lowPriceVolume;
    if (vol === 0) continue;
    const price = p.avgHighPrice ?? p.avgLowPrice;
    const up = prevPrice == null || (price != null && price >= prevPrice);
    result.push({
      time: p.timestamp as UTCTimestamp,
      value: vol,
      color: up ? "#22c55e30" : "#ef444430",
    });
    if (price != null) prevPrice = price;
  }

  return result;
}

// --- Detail panel ---

function MarketDetail({
  item,
  price,
  onClose,
  onAddToWatchlist,
  isWatched,
}: {
  item: ItemMapping;
  price?: ItemPrice;
  onClose: () => void;
  onAddToWatchlist: () => void;
  isWatched: boolean;
}) {
  const [period, setPeriod] = useState<Period>("1M");
  const [chartMode, setChartMode] = useState<ChartMode>("line");
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading state for async fetch
    setChartLoading(true);
    setChartError(null);

    const timestep = PERIOD_TIMESTEP[period];
    fetchTimeseries(item.id, timestep)
      .then((ts) => {
        if (!cancelled) {
          setTimeseries(ts);
          setChartLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setChartError("Failed to load chart data.");
          setChartLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [item.id, period]);

  const filtered = useMemo(
    () => filterByPeriod(timeseries, period),
    [timeseries, period]
  );

  const chartData = useMemo(() => {
    if (chartMode === "candlestick") return toCandlestickData(filtered);
    return toLineData(filtered);
  }, [filtered, chartMode]);

  const volumeData = useMemo(() => toVolumeData(filtered), [filtered]);

  const margin =
    price?.high != null && price?.low != null
      ? price.high - price.low
      : null;

  const wikiUrl = `https://oldschool.runescape.wiki/w/${encodeURIComponent(item.name.replace(/ /g, "_"))}`;

  return (
    <div className="bg-bg-secondary rounded-lg p-4 sticky top-0 overflow-y-auto max-h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <img
            src={`https://oldschool.runescape.wiki/images/${item.icon}`}
            alt={item.name}
            className="w-8 h-8"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div>
            <h3 className="text-lg font-semibold leading-tight">
              {item.name}
            </h3>
            {item.members && (
              <span className="text-xs bg-warning/20 text-warning px-1.5 py-0.5 rounded">
                P2P
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary text-lg leading-none"
        >
          ✕
        </button>
      </div>

      {item.examine && (
        <p className="text-xs text-text-secondary italic mb-4">
          {item.examine}
        </p>
      )}

      {/* Price stats */}
      <div className="space-y-1.5 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Buy Price</span>
          <div className="text-right">
            <span className="text-success">{formatGp(price?.high ?? null)}</span>
            <span className="text-xs text-text-secondary ml-1.5">
              {timeAgo(price?.highTime ?? null)}
            </span>
          </div>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Sell Price</span>
          <div className="text-right">
            <span className="text-danger">{formatGp(price?.low ?? null)}</span>
            <span className="text-xs text-text-secondary ml-1.5">
              {timeAgo(price?.lowTime ?? null)}
            </span>
          </div>
        </div>
        {margin != null && (
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Margin</span>
            <span className={margin >= 0 ? "text-success" : "text-danger"}>
              {margin > 0 ? "+" : ""}
              {formatGp(margin)}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">High Alch</span>
          <span className="text-warning">{formatGp(item.highalch)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Low Alch</span>
          <span>{formatGp(item.lowalch)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Store Value</span>
          <span className="text-text-secondary">{formatGp(item.value)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Buy Limit</span>
          <span className="text-text-secondary">
            {item.limit?.toLocaleString() ?? "\u2014"}
          </span>
        </div>
      </div>

      {/* Chart controls */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex bg-bg-primary rounded-lg p-0.5 border border-border">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${
                period === p
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex bg-bg-primary rounded-lg p-0.5 border border-border">
          <button
            onClick={() => setChartMode("line")}
            className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${
              chartMode === "line"
                ? "bg-accent text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setChartMode("candlestick")}
            className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${
              chartMode === "candlestick"
                ? "bg-accent text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Candle
          </button>
        </div>
      </div>

      {/* Chart */}
      {chartError && (
        <p className="text-xs text-danger mb-2">{chartError}</p>
      )}
      {chartLoading ? (
        <div className="h-[250px] bg-bg-primary rounded-lg border border-border flex items-center justify-center">
          <p className="text-xs text-text-secondary">Loading chart...</p>
        </div>
      ) : chartData.length > 0 ? (
        <div className="bg-bg-primary rounded-lg border border-border p-1">
          <Chart
            data={chartData}
            volumeData={volumeData}
            type={chartMode}
            height={250}
          />
        </div>
      ) : (
        <div className="h-[250px] bg-bg-primary rounded-lg border border-border flex items-center justify-center">
          <p className="text-xs text-text-secondary">
            No data for this period.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={onAddToWatchlist}
          disabled={isWatched}
          className={`flex-1 text-xs py-2 rounded transition-colors ${
            isWatched
              ? "bg-bg-tertiary text-text-secondary"
              : "bg-accent hover:bg-accent-hover text-white"
          }`}
        >
          {isWatched ? "On Watchlist" : "Add to Watchlist"}
        </button>
        <a
          href={wikiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center text-xs py-2 rounded bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
        >
          View on Wiki
        </a>
      </div>
    </div>
  );
}

// --- Main Market view ---

export default function Market() {
  const { items: watchlistItems, addItem: addToWatchlist } = useWatchlist();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);

  const [tab, setTab] = useState<Tab>("search");
  const [membersFilter, setMembersFilter] = useState<"all" | "f2p" | "p2p">(
    "all"
  );

  const [allItems, setAllItems] = useState<ItemMapping[]>([]);
  const [searchResults, setSearchResults] = useState<ItemMapping[]>([]);
  const [prices, setPrices] = useState<Record<string, ItemPrice>>({});

  const [selectedItem, setSelectedItem] = useState<ItemMapping | null>(null);

  const [loading, setLoading] = useState(false);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load prices on mount
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
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial price load
    return loadPrices();
  }, [loadPrices]);

  // Search items when query changes
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear results when query is too short
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchItems(debouncedQuery)
      .then((items) => {
        if (!cancelled) {
          setSearchResults(items);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setError("Search failed. Try again.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // Load full item mapping when Browse tab is activated
  useEffect(() => {
    if (tab !== "browse" || allItems.length > 0) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading state for async fetch
    setBrowseLoading(true);
    fetchMapping()
      .then((items) => {
        if (!cancelled) {
          setAllItems(items);
          setBrowseLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBrowseLoading(false);
          setError("Failed to load item database.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tab, allItems.length]);

  // Auto-switch to search tab when typing
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync tab state with query input
    if (query.length >= 2) setTab("search");
  }, [query]);

  // Browse filtered results
  const browseFiltered = useMemo(() => {
    let result = allItems;
    if (query.length >= 2) {
      const q = query.toLowerCase();
      result = result.filter((item) => item.name.toLowerCase().includes(q));
    }
    if (membersFilter === "f2p") result = result.filter((i) => !i.members);
    if (membersFilter === "p2p") result = result.filter((i) => i.members);
    return result.slice(0, 100);
  }, [allItems, query, membersFilter]);

  // The items to show in the table
  const displayItems = tab === "search" ? searchResults : browseFiltered;
  const showTable =
    tab === "browse"
      ? !browseLoading
      : query.length >= 2 && !loading;

  return (
    <div
      className={
        selectedItem
          ? "grid grid-cols-[1fr_350px] gap-4 h-full"
          : "max-w-4xl"
      }
    >
      {/* Left: search + table */}
      <div className="min-w-0">
        <h2 className="text-xl font-semibold mb-4">Market</h2>

        {/* Search bar */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items..."
          className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm mb-3"
        />

        {/* Tabs + filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex bg-bg-secondary rounded-lg p-0.5 border border-border">
            <button
              onClick={() => setTab("search")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === "search"
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Search Results
            </button>
            <button
              onClick={() => setTab("browse")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === "browse"
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Browse All
              {allItems.length > 0 && (
                <span className="ml-1 text-[10px] opacity-70">
                  ({allItems.length.toLocaleString()})
                </span>
              )}
            </button>
          </div>

          {tab === "browse" && (
            <div className="flex gap-1">
              {(["all", "f2p", "p2p"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setMembersFilter(f)}
                  className={`px-3 py-1.5 rounded text-xs uppercase transition-colors ${
                    membersFilter === f
                      ? "bg-accent text-white"
                      : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status messages */}
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
          <p className="text-xs text-text-secondary mb-2">Loading prices...</p>
        )}

        {tab === "search" && loading && (
          <p className="text-xs text-text-secondary mb-2">Searching...</p>
        )}

        {tab === "browse" && browseLoading && (
          <p className="text-xs text-text-secondary mb-2">
            Loading item database...
          </p>
        )}

        {tab === "search" && query.length < 2 && (
          <p className="text-sm text-text-secondary text-center py-8">
            Type at least 2 characters to search, or switch to Browse All.
          </p>
        )}

        {/* Results table */}
        {showTable && displayItems.length > 0 && (
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
                {displayItems.map((item) => {
                  const price = prices[String(item.id)];
                  const itemMargin =
                    price?.high != null && price?.low != null
                      ? price.high - price.low
                      : null;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`border-b border-border/50 hover:bg-bg-tertiary transition-colors cursor-pointer ${
                        selectedItem?.id === item.id
                          ? "bg-bg-tertiary"
                          : "even:bg-bg-primary/30"
                      }`}
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={itemIcon(item.name)}
                            alt=""
                            className="w-5 h-5 shrink-0"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                          <div>
                            <div className="font-medium">{item.name}</div>
                            {item.members && (
                              <span className="text-[10px] text-warning">P2P</span>
                            )}
                          </div>
                        </div>
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
                        {itemMargin == null ? (
                          "\u2014"
                        ) : (
                          <span
                            className={
                              itemMargin > 0 ? "text-success" : "text-danger"
                            }
                          >
                            {itemMargin > 0 ? "+" : ""}
                            {formatGp(itemMargin)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right text-warning">
                        {formatGp(item.highalch)}
                      </td>
                      <td className="px-4 py-2 text-right text-text-secondary">
                        {item.limit ?? "\u2014"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {tab === "browse" && browseFiltered.length >= 100 && (
              <p className="text-xs text-text-secondary text-center py-2">
                Showing first 100 results. Refine your search.
              </p>
            )}
          </div>
        )}

        {showTable && displayItems.length === 0 && tab === "search" && (
          <p className="text-sm text-text-secondary text-center py-4">
            No items found for "{query}"
          </p>
        )}

        {showTable &&
          displayItems.length === 0 &&
          tab === "browse" &&
          !browseLoading && (
            <p className="text-sm text-text-secondary text-center py-4">
              No items match your filters.
            </p>
          )}
      </div>

      {/* Right: detail panel */}
      {selectedItem && (
        <MarketDetail
          item={selectedItem}
          price={prices[String(selectedItem.id)]}
          onClose={() => setSelectedItem(null)}
          onAddToWatchlist={() => addToWatchlist(selectedItem.id, selectedItem.name)}
          isWatched={watchlistItems.some((w) => w.itemId === selectedItem.id)}
        />
      )}
    </div>
  );
}
