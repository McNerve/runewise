import { createContext, useContext, useState, useCallback, useRef } from "react";
import { fetchMapping, fetchLatestPrices, type ItemMapping, type ItemPrice } from "../lib/api/ge";
import { warn } from "../lib/logger";

interface GEDataState {
  mapping: ItemMapping[];
  prices: Record<string, ItemPrice>;
  mappingLoaded: boolean;
  pricesLoaded: boolean;
  loading: boolean;
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
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const fetchIfNeeded = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    try {
      const [m, p] = await Promise.all([fetchMapping(), fetchLatestPrices()]);
      setMapping(m);
      setPrices(p);
      setMappingLoaded(true);
      setPricesLoaded(true);
    } catch (err: unknown) {
      warn("GEData: fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPrices = useCallback(async () => {
    try {
      const p = await fetchLatestPrices();
      setPrices(p);
      setPricesLoaded(true);
    } catch (err: unknown) {
      warn("GEData: refresh prices failed", err);
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
    loading,
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
