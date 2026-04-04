import { useState, useEffect, useMemo } from "react";
import { fetchAllShops, searchShops, fetchShopImage, type Shop } from "../../lib/api/shops";
import { fetchLatestPrices, fetchMapping, type ItemPrice } from "../../lib/api/ge";
import { useDebounce } from "../../hooks/useDebounce";
import { encodeIconFilename, WIKI_IMG, itemIcon } from "../../lib/sprites";
import { formatGp } from "../../lib/format";
import WikiImage from "../../components/WikiImage";
import ItemTooltip from "../../components/ItemTooltip";
import { Skeleton } from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import { useNavigation } from "../../lib/NavigationContext";

type MembersFilter = "all" | "f2p" | "p2p";
type SortKey = "name" | "stock" | "sellPrice" | "value";

function getGEPrice(
  itemName: string,
  prices: Record<string, ItemPrice>,
  nameToId: Map<string, number>
): number | null {
  const id = nameToId.get(itemName.toLowerCase());
  if (!id) return null;
  const p = prices[String(id)];
  return p?.high ?? p?.low ?? null;
}

export default function ShopHelper() {
  const { navigate } = useNavigation();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 200);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [currencyFilter, setCurrencyFilter] = useState<"all" | "Coins" | "other">("all");
  const [membersFilter, setMembersFilter] = useState<MembersFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [prices, setPrices] = useState<Record<string, ItemPrice>>({});
  const [nameToId, setNameToId] = useState<Map<string, number>>(new Map());
  const [iconMap, setIconMap] = useState<Map<string, string>>(new Map());
  const [shopImage, setShopImage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchAllShops(), fetchLatestPrices(), fetchMapping()])
      .then(([s, p, m]) => {
        setShops(s);
        setPrices(p);
        const idMap = new Map<string, number>();
        const icons = new Map<string, string>();
        for (const item of m) {
          idMap.set(item.name.toLowerCase(), item.id);
          if (item.icon) icons.set(item.name.toLowerCase(), item.icon);
        }
        setNameToId(idMap);
        setIconMap(icons);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedShop) return;
    let cancelled = false;
    fetchShopImage(selectedShop.name).then((img) => {
      if (!cancelled) setShopImage(img);
    });
    return () => { cancelled = true; };
  }, [selectedShop]);

  const filtered = useMemo(() => {
    let results = searchShops(shops, debouncedQuery);
    if (currencyFilter === "Coins") {
      results = results.filter((s) => s.items.every((i) => i.currency === "Coins"));
    } else if (currencyFilter === "other") {
      results = results.filter((s) => s.items.some((i) => i.currency !== "Coins"));
    }
    if (membersFilter === "f2p") {
      results = results.filter((s) => !s.members);
    } else if (membersFilter === "p2p") {
      results = results.filter((s) => s.members);
    }
    return results;
  }, [shops, debouncedQuery, currencyFilter, membersFilter]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    for (const shop of shops) if (shop.location) set.add(shop.location);
    return [...set].sort();
  }, [shops]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  }

  const sortedItems = useMemo(() => {
    if (!selectedShop) return [];
    const items = [...selectedShop.items];
    return items.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "stock": cmp = (parseInt(a.stock) || 0) - (parseInt(b.stock) || 0); break;
        case "sellPrice": cmp = (a.sellPrice ?? 0) - (b.sellPrice ?? 0); break;
        case "value": {
          const aGe = getGEPrice(a.name, prices, nameToId) ?? 0;
          const bGe = getGEPrice(b.name, prices, nameToId) ?? 0;
          cmp = aGe - bGe;
          break;
        }
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [selectedShop, sortKey, sortAsc, prices, nameToId]);

  const arrow = (key: SortKey) => sortKey === key ? (sortAsc ? " ↑" : " ↓") : "";
  const showCurrencyCol = selectedShop?.items.some((i) => i.currency !== "Coins") ?? false;

  return (
    <div className="max-w-5xl">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Shop Helper</h2>
          <p className="max-w-2xl text-sm text-text-secondary">
            Browse {shops.length > 0 ? `${shops.length} ` : ""}OSRS shops with live GE price comparisons.
          </p>
        </div>
        {!loading && (
          <div className="flex items-center gap-4 text-xs text-text-secondary/50">
            <span>{locations.length} locations</span>
            <span>{shops.reduce((s, sh) => s + sh.items.length, 0).toLocaleString()} items</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 items-start">
        {/* Left — Shop list */}
        <div className="space-y-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shops, items, or locations..."
            className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm outline-none transition focus:border-accent"
          />
          <div className="flex flex-wrap gap-1.5">
            {(["all", "Coins", "other"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setCurrencyFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                  currencyFilter === f
                    ? "bg-accent/15 text-accent ring-1 ring-accent/40"
                    : "bg-bg-tertiary/50 text-text-secondary hover:bg-bg-tertiary"
                }`}
              >
                {f === "all" ? "All" : f === "Coins" ? "Coins" : "Special"}
              </button>
            ))}
            <div className="w-px bg-border/30 mx-0.5" />
            {(["all", "f2p", "p2p"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setMembersFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                  membersFilter === f
                    ? "bg-accent/15 text-accent ring-1 ring-accent/40"
                    : "bg-bg-tertiary/50 text-text-secondary hover:bg-bg-tertiary"
                }`}
              >
                {f === "all" ? "Both" : f === "f2p" ? "F2P" : "P2P"}
              </button>
            ))}
            <span className="ml-auto text-[10px] text-text-secondary/40 self-center">
              {filtered.length}
            </span>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No shops found" description="Try a different search or filter." />
          ) : (
            <div
              className="space-y-0.5 overflow-y-auto scroll-fade"
              style={{ maxHeight: "calc(100vh - 280px)" }}
            >
              {filtered.slice(0, 150).map((shop) => (
                <button
                  key={shop.name}
                  onClick={() => { setSelectedShop(shop); setShopImage(null); setSortKey("name"); setSortAsc(true); }}
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                    selectedShop?.name === shop.name
                      ? "bg-accent/10 ring-1 ring-accent/30"
                      : "hover:bg-bg-tertiary/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <WikiImage
                      src={`${WIKI_IMG}/General_store_icon.png`}
                      alt=""
                      className="w-4 h-4 shrink-0 opacity-40"
                      fallback="S"
                    />
                    <span className="font-medium truncate flex-1">{shop.name}</span>
                    {shop.members && <span className="text-[9px] text-accent shrink-0">P2P</span>}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-text-secondary/40 mt-0.5 ml-6">
                    {shop.location && <span>{shop.location}</span>}
                    <span>{shop.items.length} items</span>
                  </div>
                </button>
              ))}
              {filtered.length > 150 && (
                <div className="text-[10px] text-text-secondary/40 text-center py-2">
                  Showing 150 of {filtered.length} — refine your search
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — Shop detail */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          {selectedShop ? (
            <div className="space-y-4">
              {/* Shop header card */}
              <div className="rounded-xl border border-border/40 bg-bg-primary/20 overflow-hidden">
                {shopImage && (
                  <img
                    src={shopImage}
                    alt={selectedShop.name}
                    className="w-full h-44 object-contain bg-bg-tertiary/30 border-b border-border/30"
                  />
                )}
                <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold">{selectedShop.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {selectedShop.location && (
                        <span className="inline-flex items-center gap-1 text-xs text-text-secondary rounded-full border border-border/40 bg-bg-tertiary/30 px-2 py-0.5">
                          <svg className="w-3 h-3 text-text-secondary/50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z" />
                          </svg>
                          {selectedShop.location}
                        </span>
                      )}
                      <span className="text-xs text-text-secondary/50">{selectedShop.items.length} items</span>
                      {selectedShop.members ? (
                        <span className="text-[10px] text-accent border border-accent/20 bg-accent/5 rounded-full px-2 py-0.5">Members</span>
                      ) : (
                        <span className="text-[10px] text-success border border-success/20 bg-success/5 rounded-full px-2 py-0.5">F2P</span>
                      )}
                      {showCurrencyCol && (
                        <span className="text-[10px] text-warning border border-warning/20 bg-warning/5 rounded-full px-2 py-0.5">
                          {[...new Set(selectedShop.items.map((i) => i.currency))].join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={`https://oldschool.runescape.wiki/w/${encodeURIComponent(selectedShop.name.replace(/ /g, "_"))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg border border-border bg-bg-primary/60 px-2.5 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors"
                  >
                    Wiki
                  </a>
                </div>
                </div>
              </div>

              {/* Item table */}
              <div className="rounded-xl border border-border/40 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-secondary text-xs">
                      <th className="text-left px-3 py-2 w-6" />
                      <th
                        className="text-left px-3 py-2 cursor-pointer hover:text-text-primary"
                        onClick={() => handleSort("name")}
                      >
                        Item{arrow("name")}
                      </th>
                      <th
                        className="text-right px-3 py-2 cursor-pointer hover:text-text-primary"
                        onClick={() => handleSort("stock")}
                      >
                        Stock{arrow("stock")}
                      </th>
                      <th
                        className="text-right px-3 py-2 cursor-pointer hover:text-text-primary"
                        onClick={() => handleSort("sellPrice")}
                      >
                        Shop Price{arrow("sellPrice")}
                      </th>
                      <th
                        className="text-right px-3 py-2 cursor-pointer hover:text-text-primary"
                        onClick={() => handleSort("value")}
                      >
                        GE Price{arrow("value")}
                      </th>
                      {showCurrencyCol && (
                        <th className="text-right px-3 py-2">Currency</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedItems.map((item, i) => {
                      const gePrice = getGEPrice(item.name, prices, nameToId);
                      const saving = item.sellPrice != null && gePrice != null ? gePrice - item.sellPrice : null;
                      return (
                        <tr
                          key={`${item.name}-${i}`}
                          className="border-b border-border/20 even:bg-bg-primary/25 hover:bg-bg-secondary/40 transition-colors"
                        >
                          <td className="px-3 py-1.5">
                            <WikiImage
                              src={(() => {
                                const geIcon = iconMap.get(item.name.toLowerCase());
                                if (geIcon) return `${WIKI_IMG}/${encodeIconFilename(geIcon)}`;
                                return itemIcon(item.name);
                              })()}
                              alt={item.name}
                              className="w-5 h-5"
                              fallback={item.name[0]}
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <ItemTooltip itemName={item.name}>
                              <button
                                type="button"
                                onClick={() => navigate("wiki", { page: item.name.replace(/ /g, "_") })}
                                className="text-left hover:text-accent transition-colors font-medium"
                              >
                                {item.name}
                              </button>
                            </ItemTooltip>
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-text-secondary">
                            {item.stock === "∞" ? "∞" : parseInt(item.stock).toLocaleString()}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums">
                            {item.sellPrice != null ? (
                              <span className="text-text-primary">{formatGp(item.sellPrice)}</span>
                            ) : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums">
                            {gePrice != null ? (
                              <div>
                                <span className="text-text-secondary">{formatGp(gePrice)}</span>
                                {saving != null && saving > 0 && (
                                  <div className="text-[9px] text-success">Save {formatGp(saving)}</div>
                                )}
                              </div>
                            ) : "—"}
                          </td>
                          {showCurrencyCol && (
                            <td className="px-3 py-1.5 text-right text-xs text-text-secondary">
                              {item.currency}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="text-[10px] text-text-secondary/40 text-right">
                Data from OSRS Wiki · Shop Price = cost to buy from shop · GE Price = Grand Exchange value
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border/40 bg-bg-primary/20 p-12 text-center">
              <WikiImage
                src={`${WIKI_IMG}/General_store_icon.png`}
                alt=""
                className="w-12 h-12 mx-auto mb-3 opacity-30"
                fallback="S"
              />
              <div className="text-sm text-text-secondary">Select a shop to view its inventory</div>
              <div className="text-xs text-text-secondary/40 mt-1">
                Search by shop name, location, or item
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
