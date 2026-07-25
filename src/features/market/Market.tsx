import { lazy, Suspense, useState, useEffect, useMemo, useCallback } from "react";
import {
  searchItems,
  fetchVolumes,
  type ItemMapping,
} from "../../lib/api/ge";
import { useGEData } from "../../hooks/useGEData";
import { useDebounce } from "../../hooks/useDebounce";
import { useWatchlist } from "../../hooks/useWatchlist";
import { formatGp, timeAgo } from "../../lib/format";
import { alchProfit, natureRunePrice } from "../../lib/alch";
import FreshnessStrip from "../../components/FreshnessStrip";
import { itemIcon, encodeIconFilename, WIKI_IMG } from "../../lib/sprites";
import { useNavigation } from "../../lib/NavigationContext";
import WikiImage from "../../components/WikiImage";
import { Skeleton, TableSkeleton } from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import ItemTooltip from "../../components/ItemTooltip";
import { useSettings } from "../../hooks/useSettings";
import { Tabs, FilterPills, StatGrid, StatCard } from "../../components/primitives";
import { priceMargin } from "./shared";
import MarketDetail from "./components/MarketDetail";

type Tab = "search" | "browse" | "flips" | "watchlist" | "alch" | "bulk";
const VALID_PARAM_TABS: Tab[] = ["watchlist", "alch", "browse", "bulk", "flips"];
const Watchlist = lazy(() => import("../watchlist/Watchlist"));
const AlchCalculator = lazy(() => import("../alch-calc/AlchCalculator"));
const BulkSearch = lazy(() => import("./components/BulkSearch"));
const FlipFinder = lazy(() => import("./components/FlipFinder"));

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
  const {
    mapping: allItems,
    prices,
    pricesLoaded,
    pricesUpdatedAt,
    fetchIfNeeded,
    refreshPrices,
  } = useGEData();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);

  const paramTab = params.tab as Tab | undefined;
  const resolvedInitial: Tab = paramTab && VALID_PARAM_TABS.includes(paramTab) ? paramTab : initialTab;
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

  const handlePricesRefresh = useCallback(async () => {
    await refreshPrices();
  }, [refreshPrices]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (paramTab && VALID_PARAM_TABS.includes(paramTab)) {
      setTab(paramTab);
    }
  }, [paramTab]);

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
  // GE cap: items with buy price >= 2.147B gp hit the GE integer cap and
  // produce useless displays (e.g., Alch Profit wrapping to -2.147B). Drop
  // them from the catalogue — they're never tradeable in that state.
  const GE_PRICE_CAP = 2_147_000_000;
  const browseFiltered = useMemo(() => {
    let result = allItems.filter((item) => {
      const price = prices[String(item.id)];
      return price?.high == null || price.high < GE_PRICE_CAP;
    });
    if (query.length >= 2) {
      const q = query.toLowerCase();
      result = result.filter((item) => item.name.toLowerCase().includes(q));
    }
    if (membersFilter === "f2p") result = result.filter((i) => !i.members);
    if (membersFilter === "p2p") result = result.filter((i) => i.members);
    return result.slice(0, 100);
  }, [allItems, prices, query, membersFilter]);

  // The items to show in the table
  const displayItems = tab === "search" ? searchResults : browseFiltered;
  const showTable =
    tab === "browse"
      ? !browseLoading
      : query.length >= 2 && !loading;
  const selectedPrice = selectedItem ? prices[String(selectedItem.id)] : undefined;
  const natureRuneCost = natureRunePrice(prices);
  const selectedWatched = selectedItem
    ? watchlistItems.some((item) => item.itemId === selectedItem.id)
    : false;
  const selectedMargin = priceMargin(selectedPrice);
  const selectedSummary = selectedItem
    ? [
        {
          label: "Instabuy",
          value: formatGp(selectedPrice?.high ?? null),
          tone: "text-success",
        },
        {
          label: "Instasell",
          value: formatGp(selectedPrice?.low ?? null),
          tone: "text-danger",
        },
        {
          label: "Margin (after tax)",
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
          ? "grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_350px] gap-4 h-full"
          : "max-w-4xl"
      }
    >
      {/* Left: search + table */}
      <div className="min-w-0">
        <div className="mb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-hero font-semibold tracking-tight">{title}</h2>
              <p className="max-w-2xl text-sm text-text-secondary">{subtitle}</p>
            </div>
            <div className="shrink-0 pt-1">
              <FreshnessStrip updatedAt={pricesUpdatedAt} onRefresh={handlePricesRefresh} cacheLabel="5 min" />
            </div>
          </div>
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
                      : "bg-accent text-on-accent hover:bg-accent-hover"
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
        ) : tab === "search" && query.trim().length < 2 ? (
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border-subtle bg-bg-tertiary px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                Search Flow
              </div>
              <div className="mt-1 text-sm text-text-secondary">
                Find a specific item to inspect live prices, charts, and wiki context.
              </div>
            </div>
            <div className="rounded-xl border border-border-subtle bg-bg-tertiary px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                Browse Flow
              </div>
              <div className="mt-1 text-sm text-text-secondary">
                Switch to Browse All for the full catalogue with members filtering.
              </div>
            </div>
            <div className="rounded-xl border border-border-subtle bg-bg-tertiary px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                Workspace Goal
              </div>
              <div className="mt-1 text-sm text-text-secondary">
                Use this as your hub for pricing, alch checks, watchlist adds, and wiki jumps.
              </div>
            </div>
          </div>
        ) : null}

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
              { id: "flips" as Tab, label: "Flip Finder", description: "Most profitable flips now" },
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
        {tab === "flips" ? (
          <Suspense fallback={<div className="py-8 text-center"><div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-3/4 mx-auto" /></div>}>
            <FlipFinder mapping={allItems} prices={prices} />
          </Suspense>
        ) : tab === "watchlist" ? (
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
          className="w-full bg-bg-tertiary border border-border rounded-lg px-4 py-2.5 text-sm mb-3"
        />

        {/* Status messages — sticky so Retry stays visible while scrolling results */}
        {error && (
          <div className="sticky top-0 z-10 flex items-center gap-2 mb-2 rounded-lg border border-danger/30 bg-bg-secondary/95 px-3 py-2 backdrop-blur-sm">
            <p className="text-xs text-danger flex-1">{error}</p>
            <button
              type="button"
              onClick={loadPrices}
              aria-label="Retry loading market prices"
              className="text-xs text-accent hover:text-accent-hover transition-colors shrink-0"
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
          <div className="rounded-xl border border-border/60 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="sticky-thead">
                <tr className="border-b border-border text-text-secondary text-xs">
                  <th scope="col" className="text-left px-4 py-2">Item</th>
                  <th scope="col" className="text-right px-4 py-2" title="GE high — pay this to buy immediately">Instabuy</th>
                  <th scope="col" className="text-right px-4 py-2" title="GE low — receive this when selling immediately">Instasell</th>
                  <th scope="col" className="text-right px-4 py-2" title="Post-tax instasell − instabuy (offer flip uses the reverse book side)">Net Margin</th>
                  <th scope="col" className="text-right px-4 py-2">Volume</th>
                  <th scope="col" className="text-right px-4 py-2">High Alch</th>
                  <th scope="col" className="text-right px-4 py-2">Alch Profit</th>
                  <th scope="col" className="text-right px-4 py-2">Limit</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item) => {
                  const price = prices[String(item.id)];
                  const itemMargin = priceMargin(price);
                  const itemAlchProfit =
                    item.highalch != null && price?.high != null
                      ? alchProfit(item.highalch, price.high, natureRuneCost)
                      : null;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`border-b border-border/50 hover:bg-bg-secondary transition-colors cursor-pointer ${
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
                              <span className="text-[10px] text-text-secondary/60">P2P</span>
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
                      <td className="px-4 py-2 text-right text-text-secondary num">
                        {volumes[String(item.id)]
                          ? formatGp(volumes[String(item.id)])
                          : "\u2014"}
                      </td>
                      <td className="px-4 py-2 text-right text-text-primary">
                        {formatGp(item.highalch)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {itemAlchProfit == null || itemAlchProfit < 0 ? (
                          <span className="text-text-secondary/40">{"\u2014"}</span>
                        ) : (
                          <span className={itemAlchProfit >= 0 ? "text-success" : "text-danger"}>
                            {itemAlchProfit > 0 ? "+" : ""}{formatGp(itemAlchProfit)}
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
