import { lazy, Suspense, useState, useEffect, useMemo, useCallback } from "react";
import {
  searchItems,
  fetchVolumes,
  type ItemMapping,
  type ItemPrice,
} from "../../lib/api/ge";
import { useGEData } from "../../hooks/useGEData";
import {
  fetchTimeseries,
  type TimeseriesPoint,
} from "../../lib/api/ge-timeseries";
import { useDebounce } from "../../hooks/useDebounce";
import { useWatchlist } from "../../hooks/useWatchlist";
import { formatGp, timeAgo } from "../../lib/format";
import { itemIcon, encodeIconFilename, WIKI_IMG } from "../../lib/sprites";
import { useNavigation } from "../../lib/NavigationContext";
import WikiImage from "../../components/WikiImage";
import { Skeleton, TableSkeleton } from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import ItemTooltip from "../../components/ItemTooltip";
import { useSettings } from "../../hooks/useSettings";
import { Tabs, FilterPills, StatGrid, StatCard } from "../../components/primitives";
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
} from "./shared";

type Tab = "search" | "browse" | "watchlist" | "alch" | "bulk";
const Chart = lazy(() => import("../../components/Chart"));
const Watchlist = lazy(() => import("../watchlist/Watchlist"));
const AlchCalculator = lazy(() => import("../alch-calc/AlchCalculator"));
const BulkSearch = lazy(() => import("./components/BulkSearch"));

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
    <div className="bg-bg-secondary rounded-lg p-4 sticky top-0 overflow-y-auto max-h-[calc(100vh-6rem)]">
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
            aria-pressed={chartMode === "line"}
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
            aria-pressed={chartMode === "candlestick"}
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
      {chartBody}

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

// --- Main Market view ---

interface MarketProps {
  initialTab?: Tab;
  title?: string;
  subtitle?: string;
}

export default function Market({
  initialTab = "search",
  title = "Item Workspace",
  subtitle = "Search items, compare prices, inspect trends, and move into watchlists from one shared workspace.",
}: MarketProps) {
  const { params, navigate } = useNavigation();
  const { settings } = useSettings();
  const { items: watchlistItems, addItem: addToWatchlist } = useWatchlist();
  const { mapping: allItems, prices, pricesLoaded, fetchIfNeeded } = useGEData();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);

  const paramTab = params.tab as Tab | undefined;
  const resolvedInitial: Tab = paramTab === "watchlist" || paramTab === "alch" || paramTab === "browse" || paramTab === "bulk" ? paramTab : initialTab;
  const [tab, setTab] = useState<Tab>(resolvedInitial);
  const [membersFilter, setMembersFilter] = useState<"all" | "f2p" | "p2p">(
    "all"
  );

  const [searchResults, setSearchResults] = useState<ItemMapping[]>([]);
  const [volumes, setVolumes] = useState<Record<string, number>>({});

  const [selectedItem, setSelectedItem] = useState<ItemMapping | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchIfNeeded(); }, [fetchIfNeeded]);

  // Load volumes on mount (not part of GE context)
  useEffect(() => {
    let cancelled = false;
    fetchVolumes()
      .then((v) => {
        if (!cancelled) setVolumes(v);
      })
      .catch(() => {
        // volumes are optional — fail silently
      });
    return () => { cancelled = true; };
  }, []);

  const loadPrices = useCallback(() => {
    // Prices now come from GE context; this is kept for the retry button
    fetchIfNeeded();
  }, [fetchIfNeeded]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (params.query) {
      setQuery(params.query);
    }
    if (params.query && initialTab === "browse") {
      setTab("browse");
    }
  }, [params, initialTab]);

  useEffect(() => {
    if (!params.query || searchResults.length === 0) return;
    if (selectedItem && selectedItem.name.toLowerCase() === params.query.toLowerCase()) {
      return;
    }

    const exactMatch = searchResults.find(
      (item) => item.name.toLowerCase() === params.query?.toLowerCase()
    );
    if (exactMatch) {
      setSelectedItem(exactMatch);
    }
  }, [params.query, searchResults, selectedItem]);

  // Search items when query changes
  useEffect(() => {
    if (debouncedQuery.length < 2) {
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

  const browseLoading = allItems.length === 0 && !pricesLoaded;

  // Auto-switch to search tab when typing
  useEffect(() => {
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
  const selectedPrice = selectedItem ? prices[String(selectedItem.id)] : undefined;
  const selectedWatched = selectedItem
    ? watchlistItems.some((item) => item.itemId === selectedItem.id)
    : false;
  const selectedMargin =
    selectedPrice?.high != null && selectedPrice?.low != null
      ? selectedPrice.high - selectedPrice.low
      : null;
  const selectedSummary = selectedItem
    ? [
        {
          label: "Buy Price",
          value: formatGp(selectedPrice?.high ?? null),
          tone: "text-success",
        },
        {
          label: "Sell Price",
          value: formatGp(selectedPrice?.low ?? null),
          tone: "text-danger",
        },
        {
          label: "Margin",
          value:
            selectedMargin == null
              ? "\u2014"
              : `${selectedMargin > 0 ? "+" : ""}${formatGp(selectedMargin)}`,
          tone:
            selectedMargin == null
              ? "text-text-primary"
              : selectedMargin >= 0
                ? "text-success"
                : "text-danger",
        },
        {
          label: "Buy Limit",
          value: selectedItem.limit?.toLocaleString() ?? "\u2014",
          tone: "text-text-primary",
        },
      ]
    : [];

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
        <div className="mb-4">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="max-w-2xl text-sm text-text-secondary">{subtitle}</p>
          {settings.ironmanMode && (
            <div className="mt-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-1.5 text-xs text-warning">
              Ironman mode — GE prices shown for reference only. Items must be self-obtained.
            </div>
          )}
        </div>

        {selectedItem ? (
          <div className="mb-4 space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                  Active Item
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <WikiImage
                    src={itemIcon(selectedItem.name)}
                    alt=""
                    className="h-9 w-9 shrink-0"
                    fallback={selectedItem.name[0]}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-lg font-semibold text-text-primary">
                      {selectedItem.name}
                    </div>
                    <div className="mt-1 text-sm text-text-secondary">
                      {selectedItem.examine || "OSRS Wiki item reference"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <a
                  href={`https://prices.runescape.wiki/osrs/item/${selectedItem.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-border bg-bg-primary/70 px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-accent/35 hover:text-text-primary"
                >
                  Full Price History
                </a>
                <button
                  type="button"
                  onClick={() => navigate("wiki", { page: selectedItem.name, query: selectedItem.name })}
                  className="rounded-xl border border-border bg-bg-primary/70 px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-accent/35 hover:text-text-primary"
                >
                  Open Wiki
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedWatched) {
                      addToWatchlist(selectedItem.id, selectedItem.name);
                    }
                    navigate("watchlist");
                  }}
                  className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                    selectedWatched
                      ? "border border-border bg-bg-primary/70 text-text-secondary hover:border-accent/35 hover:text-text-primary"
                      : "bg-accent text-white hover:bg-accent-hover"
                  }`}
                >
                  {selectedWatched ? "Open Watchlist" : "Watch Item"}
                </button>
              </div>
            </div>

            <StatGrid columns={4}>
              {selectedSummary.map((stat) => (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  accent={stat.tone}
                />
              ))}
            </StatGrid>
          </div>
        ) : (
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-bg-primary/45 px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                Search Flow
              </div>
              <div className="mt-1 text-sm text-text-secondary">
                Find a specific item to inspect live prices, charts, and wiki context.
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-bg-primary/45 px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                Browse Flow
              </div>
              <div className="mt-1 text-sm text-text-secondary">
                Switch to Browse All for the full catalogue with members filtering.
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-bg-primary/45 px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                Workspace Goal
              </div>
              <div className="mt-1 text-sm text-text-secondary">
                Use this as your hub for pricing, alch checks, watchlist adds, and wiki jumps.
              </div>
            </div>
          </div>
        )}

        {/* Tab bar — always visible */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Tabs
            variant="default"
            ariaLabel="Market sections"
            activeId={tab}
            onChange={(id) => { setTab(id); setSelectedItem(null); }}
            items={[
              { id: "search" as Tab, label: "Search", description: "Find items by name" },
              { id: "browse" as Tab, label: allItems.length > 0 ? `Browse All (${allItems.length.toLocaleString()})` : "Browse All", description: "Full item catalogue" },
              { id: "watchlist" as Tab, label: "Watchlist", description: "Tracked items" },
              { id: "alch" as Tab, label: "Alch Profits", description: "Alchemy calculator" },
              { id: "bulk" as Tab, label: "Bulk Lookup", description: "Batch price check" },
            ]}
          />

          {tab === "browse" && (
            <FilterPills
              ariaLabel="Members filter"
              activeKey={membersFilter}
              onChange={setMembersFilter}
              items={[
                { id: "all" as const, label: "All" },
                { id: "f2p" as const, label: "F2P" },
                { id: "p2p" as const, label: "P2P" },
              ]}
            />
          )}
        </div>

        {/* Tab content */}
        {tab === "watchlist" ? (
          <Suspense fallback={<div className="py-8 text-center"><div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-3/4 mx-auto" /></div>}>
            <Watchlist />
          </Suspense>
        ) : tab === "alch" ? (
          <Suspense fallback={<div className="py-8 text-center"><div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-3/4 mx-auto" /></div>}>
            <AlchCalculator />
          </Suspense>
        ) : tab === "bulk" ? (
          <Suspense fallback={<div className="py-8 text-center"><div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-3/4 mx-auto" /></div>}>
            <BulkSearch mapping={allItems} prices={prices} />
          </Suspense>
        ) : (
        <>
        {/* Search bar */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items..."
          aria-label="Search items"
          className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm mb-3"
        />

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
          <div className="mb-2"><Skeleton className="h-3 w-48 rounded" /></div>
        )}

        {tab === "search" && loading && (
          <div className="mb-2"><TableSkeleton rows={5} cols={4} /></div>
        )}

        {tab === "browse" && browseLoading && (
          <div className="mb-2"><TableSkeleton rows={8} cols={7} /></div>
        )}

        {tab === "search" && query.length < 2 && (
          <EmptyState title="Start searching" description="Type at least 2 characters to search, or switch to Browse All." />
        )}

        {/* Results table */}
        {showTable && displayItems.length > 0 && (
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary text-xs">
                  <th scope="col" className="text-left px-4 py-2">Item</th>
                  <th scope="col" className="text-right px-4 py-2">Buy</th>
                  <th scope="col" className="text-right px-4 py-2">Sell</th>
                  <th scope="col" className="text-right px-4 py-2">Margin</th>
                  <th scope="col" className="text-right px-4 py-2">Volume</th>
                  <th scope="col" className="text-right px-4 py-2">High Alch</th>
                  <th scope="col" className="text-right px-4 py-2">Alch Profit</th>
                  <th scope="col" className="text-right px-4 py-2">Limit</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item) => {
                  const price = prices[String(item.id)];
                  const itemMargin =
                    price?.high != null && price?.low != null
                      ? price.high - price.low
                      : null;
                  const alchProfit =
                    item.highalch != null && price?.high != null
                      ? item.highalch - price.high
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
                          <WikiImage
                            src={`${WIKI_IMG}/${encodeIconFilename(item.icon)}`}
                            alt=""
                            className="w-5 h-5 shrink-0"
                            fallback={item.name[0]}
                          />
                          <div>
                            <ItemTooltip itemName={item.name}><div className="font-medium cursor-default">{item.name}</div></ItemTooltip>
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
                      <td className="px-4 py-2 text-right text-text-secondary tabular-nums">
                        {volumes[String(item.id)]
                          ? formatGp(volumes[String(item.id)])
                          : "\u2014"}
                      </td>
                      <td className="px-4 py-2 text-right text-warning">
                        {formatGp(item.highalch)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {alchProfit == null ? (
                          "\u2014"
                        ) : (
                          <span className={alchProfit >= 0 ? "text-success" : "text-danger"}>
                            {alchProfit > 0 ? "+" : ""}{formatGp(alchProfit)}
                          </span>
                        )}
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
          <EmptyState title="No items found" description={`No items match "${query}".`} />
        )}

        {showTable &&
          displayItems.length === 0 &&
          tab === "browse" &&
          !browseLoading && (
            <EmptyState title="No items found" description="No items match your filters." />
          )}
        </>
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
