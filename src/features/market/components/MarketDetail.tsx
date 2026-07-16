import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { ItemMapping, ItemPrice } from "../../../lib/api/ge";
import {
  fetchTimeseries,
  type TimeseriesPoint,
} from "../../../lib/api/ge-timeseries";
import { useNavigation } from "../../../lib/NavigationContext";
import WikiImage from "../../../components/WikiImage";
import { encodeIconFilename, WIKI_IMG } from "../../../lib/sprites";
import {
  PERIODS,
  PERIOD_TIMESTEP,
  buildItemStats,
  filterByPeriod,
  itemToWikiUrl,
  toCandlestickData,
  toLineData,
  toVolumeData,
  type ChartMode,
  type Period,
} from "../shared";

const Chart = lazy(() => import("../../../components/Chart"));

export default function MarketDetail({
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
  const { navigate } = useNavigation();
  const [period, setPeriod] = useState<Period>("1M");
  const [chartMode, setChartMode] = useState<ChartMode>("line");
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const stats = useMemo(() => buildItemStats(item, price), [item, price]);

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
  const wikiUrl = itemToWikiUrl(item.name);
  const chartBody = chartLoading ? (
    <div className="h-[250px] bg-bg-primary rounded-lg border border-border flex items-center justify-center">
      <p className="text-xs text-text-secondary">Loading chart...</p>
    </div>
  ) : chartData.length > 0 ? (
    <Suspense
      fallback={
        <div className="h-[250px] bg-bg-primary rounded-lg border border-border flex items-center justify-center">
          <p className="text-xs text-text-secondary">Preparing chart...</p>
        </div>
      }
    >
      <div className="bg-bg-primary rounded-lg border border-border p-1">
        <Chart
          data={chartData}
          volumeData={volumeData}
          type={chartMode}
          height={250}
        />
      </div>
    </Suspense>
  ) : (
    <div className="h-[250px] bg-bg-primary rounded-lg border border-border flex items-center justify-center">
      <p className="text-xs text-text-secondary">
        No data for this period.
      </p>
    </div>
  );

  return (
    <div className="bg-bg-tertiary rounded-lg p-4 sticky top-0 overflow-y-auto max-h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <WikiImage
            src={`${WIKI_IMG}/${encodeIconFilename(item.icon)}`}
            alt={item.name}
            className="w-8 h-8"
            fallback={item.name[0]}
          />
          <div>
            <h3 className="text-lg font-semibold leading-tight">
              {item.name}
            </h3>
            {item.members && (
              <span className="text-xs bg-bg-tertiary text-text-secondary/80 px-1.5 py-0.5 rounded border border-border/50">
                P2P
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close item details"
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
        {stats.map((stat) => (
          <div key={stat.label} className="flex justify-between text-sm">
            <span className="text-text-secondary">{stat.label}</span>
            <div className="text-right">
              <span className={stat.className}>{stat.value}</span>
              {stat.meta && (
                <span className="text-xs text-text-secondary ml-1.5">
                  {stat.meta}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chart controls */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex bg-bg-primary rounded-lg p-0.5 border border-border">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              aria-pressed={period === p}
              title={`Show last ${p} of price data`}
              className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors cursor-pointer ${
                period === p
                  ? "bg-accent text-on-accent"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary/60"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex bg-bg-primary rounded-lg p-0.5 border border-border">
          <button
            onClick={() => setChartMode("line")}
            aria-pressed={chartMode === "line"}
            title="Switch to line chart"
            className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors cursor-pointer ${
              chartMode === "line"
                ? "bg-accent text-on-accent"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary/60"
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setChartMode("candlestick")}
            aria-pressed={chartMode === "candlestick"}
            title="Switch to candlestick chart"
            className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors cursor-pointer ${
              chartMode === "candlestick"
                ? "bg-accent text-on-accent"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary/60"
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
      {chartBody}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={onAddToWatchlist}
          disabled={isWatched}
          className={`flex-1 text-xs py-2 rounded transition-colors ${
            isWatched
              ? "bg-bg-tertiary text-text-secondary"
              : "bg-accent hover:bg-accent-hover text-on-accent"
          }`}
        >
          {isWatched ? "On Watchlist" : "Add to Watchlist"}
        </button>
        <button
          type="button"
          onClick={() => navigate("wiki", { page: item.name, query: item.name })}
          className="flex-1 text-center text-xs py-2 rounded bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
        >
          Open in App Wiki
        </button>
        <a
          href={wikiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center text-xs py-2 rounded bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
        >
          Open OSRS Wiki Site
        </a>
      </div>
    </div>
  );
}
