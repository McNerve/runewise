import { createContext, useContext, useState, useCallback, useRef } from "react";
import { fetchMapping, fetchLatestPrices, type ItemMapping, type ItemPrice } from "../lib/api/ge";
import { warn } from "../lib/logger";

interface GEDataState {
  mapping: ItemMapping[];
  prices: Record<string, ItemPrice>;
  mappingLoaded: boolean;
  pricesLoaded: boolean;
  /** When latest prices were last successfully fetched (local clock). */
  pricesUpdatedAt: Date | null;
  loading: boolean;
  /** Last fetch/refresh failure message, if any. Cleared on success. */
  error: string | null;
  fetchIfNeeded: () => Promise<void>;
  refreshPrices: () => Promise<void>;
  priceOf: (itemId: number) => number | null;
}

const GEDataContext = createContext<GEDataState | null>(null);

export const GEDataProvider = GEDataContext.Provider;

export function useGEDataProvider(): GEDataState {
  const [mapping, setMapping] = useState<ItemMapping[]>([]);
  const [prices, setPrices] = useState<Record<string, ItemPrice>>({});
  const [mappingLoaded, setMappingLoaded] = useState(false);
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const [pricesUpdatedAt, setPricesUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchIfNeeded = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const [m, p] = await Promise.all([fetchMapping(), fetchLatestPrices()]);
      setMapping(m);
      setPrices(p);
      setMappingLoaded(true);
      setPricesLoaded(true);
      setPricesUpdatedAt(new Date());
      setError(null);
    } catch (err: unknown) {
      warn("GEData: fetch failed", err);
      // Allow a later retry if the first attempt failed offline.
      fetchedRef.current = false;
      setError(err instanceof Error ? err.message : "Failed to load GE data");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPrices = useCallback(async () => {
    try {
      const p = await fetchLatestPrices();
      setPrices(p);
      setPricesLoaded(true);
      setPricesUpdatedAt(new Date());
      setError(null);
    } catch (err: unknown) {
      warn("GEData: refresh prices failed", err);
      setError(err instanceof Error ? err.message : "Failed to refresh GE prices");
    }
  }, []);

  const priceOf = useCallback(
    (itemId: number): number | null => {
      const p = prices[String(itemId)];
      return p?.high ?? p?.low ?? null;
    },
    [prices],
  );

  return {
    mapping,
    prices,
    mappingLoaded,
    pricesLoaded,
    pricesUpdatedAt,
    loading,
    error,
    fetchIfNeeded,
    refreshPrices,
    priceOf,
  };
}

export function useGEData(): GEDataState {
  const ctx = useContext(GEDataContext);
  if (!ctx) throw new Error("useGEData must be used within GEDataProvider");
  return ctx;
}
