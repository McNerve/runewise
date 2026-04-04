import { useState, useEffect, useMemo } from "react";
import { fetchAllShops, searchShops, type Shop } from "../../lib/api/shops";
import { useDebounce } from "../../hooks/useDebounce";
import { encodeIconFilename, WIKI_IMG } from "../../lib/sprites";
import { formatGp } from "../../lib/format";
import WikiImage from "../../components/WikiImage";
import ItemTooltip from "../../components/ItemTooltip";
import { Skeleton } from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";

export default function ShopHelper() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 200);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [currencyFilter, setCurrencyFilter] = useState<"all" | "Coins" | "other">("all");

  useEffect(() => {
    fetchAllShops()
      .then(setShops)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let results = searchShops(shops, debouncedQuery);
    if (currencyFilter === "Coins") {
      results = results.filter((s) => s.items.every((i) => i.currency === "Coins"));
    } else if (currencyFilter === "other") {
      results = results.filter((s) => s.items.some((i) => i.currency !== "Coins"));
    }
    return results;
  }, [shops, debouncedQuery, currencyFilter]);

  const currencies = useMemo(() => {
    const set = new Set<string>();
    for (const shop of shops) {
      for (const item of shop.items) set.add(item.currency);
    }
    return [...set].sort();
  }, [shops]);

  return (
    <div className="max-w-5xl">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold tracking-tight">Shop Helper</h2>
        <p className="max-w-2xl text-sm text-text-secondary">
          Browse {shops.length > 0 ? `${shops.length} ` : ""}OSRS shops — search by shop name, location, or item.
        </p>
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
          <div className="flex gap-1.5">
            {(["all", "Coins", "other"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setCurrencyFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                  currencyFilter === f
                    ? "bg-accent text-white"
                    : "bg-bg-tertiary/50 text-text-secondary hover:bg-bg-tertiary"
                }`}
              >
                {f === "all" ? "All" : f === "Coins" ? "Coins" : "Special"}
              </button>
            ))}
            {!loading && (
              <span className="ml-auto text-xs text-text-secondary/40 self-center">
                {filtered.length} shops
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No shops found" description="Try a different search." />
          ) : (
            <div
              className="space-y-1 overflow-y-auto"
              style={{ maxHeight: "calc(100vh - 280px)" }}
            >
              {filtered.slice(0, 100).map((shop) => (
                <button
                  key={shop.name}
                  onClick={() => setSelectedShop(shop)}
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                    selectedShop?.name === shop.name
                      ? "bg-accent/10 border border-accent/30"
                      : "hover:bg-bg-tertiary/50"
                  }`}
                >
                  <div className="font-medium truncate">{shop.name}</div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary/50 mt-0.5">
                    {shop.location && <span>{shop.location}</span>}
                    <span>{shop.items.length} items</span>
                    {shop.members && <span className="text-accent">P2P</span>}
                  </div>
                </button>
              ))}
              {filtered.length > 100 && (
                <div className="text-xs text-text-secondary/40 text-center py-2">
                  Showing 100 of {filtered.length} — refine your search
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — Shop detail */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          {selectedShop ? (
            <div className="rounded-xl border border-border/40 bg-bg-primary/20 p-4 space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedShop.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
                  {selectedShop.location && <span>{selectedShop.location}</span>}
                  <span>{selectedShop.items.length} items</span>
                  {selectedShop.members && <span className="text-accent">Members</span>}
                  {currencies.length > 1 && (
                    <span>Currency: {[...new Set(selectedShop.items.map((i) => i.currency))].join(", ")}</span>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border/40 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-secondary text-xs">
                      <th className="text-left px-3 py-2 w-6" />
                      <th className="text-left px-3 py-2">Item</th>
                      <th className="text-right px-3 py-2">Stock</th>
                      <th className="text-right px-3 py-2">Buy</th>
                      <th className="text-right px-3 py-2">Sell</th>
                      {selectedShop.items.some((i) => i.currency !== "Coins") && (
                        <th className="text-right px-3 py-2">Currency</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedShop.items.map((item, i) => (
                      <tr
                        key={`${item.name}-${i}`}
                        className="border-b border-border/20 even:bg-bg-primary/25 hover:bg-bg-secondary/40 transition-colors"
                      >
                        <td className="px-3 py-1.5">
                          <WikiImage
                            src={item.image ? `${WIKI_IMG}/${encodeIconFilename(item.image)}` : ""}
                            alt=""
                            className="w-5 h-5"
                            fallback={item.name[0]}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <ItemTooltip itemName={item.name}>
                            <span className="cursor-default font-medium">{item.name}</span>
                          </ItemTooltip>
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-text-secondary">
                          {item.stock === "∞" ? "∞" : item.stock}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums">
                          {item.sellPrice != null ? (
                            <span className="text-success">{formatGp(item.sellPrice)}</span>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums">
                          {item.buyPrice != null ? (
                            <span className="text-warning">{formatGp(item.buyPrice)}</span>
                          ) : "—"}
                        </td>
                        {selectedShop.items.some((i) => i.currency !== "Coins") && (
                          <td className="px-3 py-1.5 text-right text-xs text-text-secondary">
                            {item.currency}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-xs text-text-secondary/40 text-right">
                Data from OSRS Wiki · Buy = shop sells to you · Sell = shop buys from you
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border/40 bg-bg-primary/20 p-8 text-center text-sm text-text-secondary">
              Select a shop from the list to view its inventory.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
