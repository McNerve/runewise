import { useState, useEffect, useMemo } from "react";
import {
  searchItems,
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
import { formatGp } from "../../lib/format";
import Chart from "../../components/Chart";
import type {
  LineData,
  CandlestickData,
  HistogramData,
  Time,
  UTCTimestamp,
} from "lightweight-charts";
import { useNavigation } from "../../lib/NavigationContext";

type Period = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y";

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

type ChartMode = "line" | "candlestick";

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
    searchItems(debouncedQuery).then((items) => {
      if (!cancelled) {
        setSuggestions(items.slice(0, 10));
        setShowSuggestions(true);
      }
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
          {loading ? (
            <div className="h-[400px] bg-bg-secondary rounded-lg border border-border flex items-center justify-center">
              <p className="text-sm text-text-secondary">Loading chart...</p>
            </div>
          ) : chartData.length > 0 ? (
            <div className="bg-bg-secondary rounded-lg border border-border p-2">
              <Chart
                data={chartData}
                volumeData={volumeData}
                type={chartMode}
                height={400}
              />
            </div>
          ) : (
            <div className="h-[400px] bg-bg-secondary rounded-lg border border-border flex items-center justify-center">
              <p className="text-sm text-text-secondary">
                No data available for this period.
              </p>
            </div>
          )}
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
