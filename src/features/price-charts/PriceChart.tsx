import { lazy, Suspense, useState, useEffect, useMemo } from "react";
import {
  searchItems,
  fetchLatestPrices,
  type ItemMapping,
  type ItemPrice,
} from "../../lib/api/ge";
import {
  fetchTimeseries,
  type TimeseriesPoint,
} from "../../lib/api/ge-timeseries";
import { useDebounce } from "../../hooks/useDebounce";
import { formatGp } from "../../lib/format";
import { useNavigation } from "../../lib/NavigationContext";
import {
  PERIODS,
  PERIOD_TIMESTEP,
  filterByPeriod,
  toCandlestickData,
  toLineData,
  toVolumeData,
  type ChartMode,
  type Period,
} from "../market/shared";

const Chart = lazy(() => import("../../components/Chart"));

export default function PriceChart() {
  const { params } = useNavigation();

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);
  const [suggestions, setSuggestions] = useState<ItemMapping[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [selectedItem, setSelectedItem] = useState<ItemMapping | null>(null);
  const [period, setPeriod] = useState<Period>("1M");
  const [chartMode, setChartMode] = useState<ChartMode>("line");

  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<ItemPrice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search suggestions
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    searchItems(debouncedQuery)
      .then((items) => {
        if (!cancelled) {
          setSuggestions(items.slice(0, 10));
          setShowSuggestions(true);
        }
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // Auto-select from navigation params
  useEffect(() => {
    if (params.itemId && params.itemName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load from nav params
      setSelectedItem({
        id: Number(params.itemId),
        name: params.itemName,
      } as ItemMapping);
      setQuery(params.itemName);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch timeseries + price when item or period changes
  useEffect(() => {
    if (!selectedItem) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading state for async fetch
    setLoading(true);
    setError(null);

    const timestep = PERIOD_TIMESTEP[period];
    Promise.all([
      fetchTimeseries(selectedItem.id, timestep),
      fetchLatestPrices(),
    ])
      .then(([ts, prices]) => {
        if (cancelled) return;
        setTimeseries(ts);
        setCurrentPrice(prices[String(selectedItem.id)] ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Failed to load chart data.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedItem, period]);

  const selectItem = (item: ItemMapping) => {
    setSelectedItem(item);
    setQuery(item.name);
    setShowSuggestions(false);
  };

  const filtered = useMemo(
    () => filterByPeriod(timeseries, period),
    [timeseries, period]
  );

  const chartData = useMemo(() => {
    if (chartMode === "candlestick") return toCandlestickData(filtered);
    return toLineData(filtered);
  }, [filtered, chartMode]);

  const volumeData = useMemo(() => toVolumeData(filtered), [filtered]);

  const stats = useMemo(() => {
    const prices = filtered
      .filter((p) => p.avgHighPrice != null)
      .map((p) => p.avgHighPrice!);
    const volumes = filtered.map(
      (p) => p.highPriceVolume + p.lowPriceVolume
    );
    const totalVolume = volumes.reduce((a, b) => a + b, 0);
    const avgVolume =
      volumes.length > 0 ? Math.round(totalVolume / volumes.length) : 0;

    return {
      high: prices.length > 0 ? Math.max(...prices) : null,
      low: prices.length > 0 ? Math.min(...prices) : null,
      avgVolume,
    };
  }, [filtered]);

  const current = currentPrice?.high ?? currentPrice?.low ?? null;
  const chartBody = loading ? (
    <div className="h-[400px] bg-bg-secondary rounded-lg border border-border flex items-center justify-center">
      <p className="text-sm text-text-secondary">Loading chart...</p>
    </div>
  ) : chartData.length > 0 ? (
    <Suspense
      fallback={
        <div className="h-[400px] bg-bg-secondary rounded-lg border border-border flex items-center justify-center">
          <p className="text-sm text-text-secondary">Preparing chart...</p>
        </div>
      }
    >
      <div className="bg-bg-secondary rounded-lg border border-border p-2">
        <Chart
          data={chartData}
          volumeData={volumeData}
          type={chartMode}
          height={400}
        />
      </div>
    </Suspense>
  ) : (
    <div className="h-[400px] bg-bg-secondary rounded-lg border border-border flex items-center justify-center">
      <p className="text-sm text-text-secondary">
        No data available for this period.
      </p>
    </div>
  );

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-semibold mb-4">GE Price Charts</h2>

      {/* Search */}
      <div className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length < 2) setShowSuggestions(false);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          placeholder="Search items..."
          className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-20 w-full mt-1 bg-bg-secondary border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {suggestions.map((item) => (
              <button
                key={item.id}
                onClick={() => selectItem(item)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-bg-tertiary transition-colors"
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <>
          {/* Controls row */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {/* Period pills */}
            <div className="flex bg-bg-secondary rounded-lg p-0.5 border border-border">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    period === p
                      ? "bg-accent text-white"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Chart type toggle */}
            <div className="flex bg-bg-secondary rounded-lg p-0.5 border border-border">
              <button
                onClick={() => setChartMode("line")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  chartMode === "line"
                    ? "bg-accent text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Line
              </button>
              <button
                onClick={() => setChartMode("candlestick")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  chartMode === "candlestick"
                    ? "bg-accent text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Candle
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-bg-secondary rounded-lg px-3 py-2 border border-border">
              <div className="text-[10px] uppercase tracking-wider text-text-secondary mb-0.5">
                Current
              </div>
              <div className="text-sm font-medium text-accent">
                {formatGp(current)}
              </div>
            </div>
            <div className="bg-bg-secondary rounded-lg px-3 py-2 border border-border">
              <div className="text-[10px] uppercase tracking-wider text-text-secondary mb-0.5">
                High
              </div>
              <div className="text-sm font-medium text-success">
                {formatGp(stats.high)}
              </div>
            </div>
            <div className="bg-bg-secondary rounded-lg px-3 py-2 border border-border">
              <div className="text-[10px] uppercase tracking-wider text-text-secondary mb-0.5">
                Low
              </div>
              <div className="text-sm font-medium text-danger">
                {formatGp(stats.low)}
              </div>
            </div>
            <div className="bg-bg-secondary rounded-lg px-3 py-2 border border-border">
              <div className="text-[10px] uppercase tracking-wider text-text-secondary mb-0.5">
                Avg Vol
              </div>
              <div className="text-sm font-medium text-text-primary">
                {stats.avgVolume.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Chart */}
          {error && (
            <p className="text-xs text-danger mb-2">{error}</p>
          )}
          {chartBody}
        </>
      )}

      {!selectedItem && (
        <div className="text-sm text-text-secondary text-center py-12">
          Search for an item to view its price history.
        </div>
      )}
    </div>
  );
}
