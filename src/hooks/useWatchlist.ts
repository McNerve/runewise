import { useState, useEffect, useCallback } from "react";
import { fetchLatestPrices, type ItemPrice } from "../lib/api/ge";
import { loadJSON, saveJSON } from "../lib/localStorage";
import { sendNotification } from "../lib/notify";
import { formatGp } from "../lib/format";
import { useSettings } from "./useSettings";

const WATCHLIST_KEY = "runewise_watchlist";
const POLL_INTERVAL = 60_000;

export interface WatchItem {
  itemId: number;
  itemName: string;
  thresholdHigh: number | null;
  thresholdLow: number | null;
  notifiedHigh: boolean;
  notifiedLow: boolean;
}

export function useWatchlist() {
  const { settings } = useSettings();
  const [items, setItems] = useState<WatchItem[]>(() => loadJSON(WATCHLIST_KEY, []));
  const [prices, setPrices] = useState<Record<string, ItemPrice>>({});

  useEffect(() => { saveJSON(WATCHLIST_KEY, items); }, [items]);

  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    const check = () => {
      if (document.visibilityState === "hidden") return;
      fetchLatestPrices()
        .then((p) => {
          if (cancelled) return;
          setPrices(p);
          setItems((prev) =>
            prev.map((item) => {
              const price = p[String(item.itemId)];
              const current = price?.high ?? price?.low ?? null;
              if (current == null) return item;
              let updated = item;
              if (item.thresholdHigh != null && current >= item.thresholdHigh && !item.notifiedHigh) {
                if (settings.notifications.priceAlerts) {
                  sendNotification("Price Alert", `${item.itemName} is now ${formatGp(current)} (above ${formatGp(item.thresholdHigh)})`);
                }
                updated = { ...updated, notifiedHigh: true };
              }
              if (item.thresholdLow != null && current <= item.thresholdLow && !item.notifiedLow) {
                if (settings.notifications.priceAlerts) {
                  sendNotification("Price Alert", `${item.itemName} is now ${formatGp(current)} (below ${formatGp(item.thresholdLow)})`);
                }
                updated = { ...updated, notifiedLow: true };
              }
              return updated;
            })
          );
        })
        .catch(() => {
          // Silently retry on next interval
        });
    };
    check();
    const interval = setInterval(check, POLL_INTERVAL);
    return () => { cancelled = true; clearInterval(interval); };
  }, [items.length, settings.notifications.priceAlerts]);

  const addItem = useCallback((itemId: number, itemName: string) => {
    setItems((prev) => {
      if (prev.some((i) => i.itemId === itemId)) return prev;
      return [...prev, { itemId, itemName, thresholdHigh: null, thresholdLow: null, notifiedHigh: false, notifiedLow: false }];
    });
  }, []);

  const removeItem = useCallback((itemId: number) => {
    setItems((prev) => prev.filter((i) => i.itemId !== itemId));
  }, []);

  const updateThreshold = useCallback((itemId: number, field: "thresholdHigh" | "thresholdLow", value: number | null) => {
    setItems((prev) => prev.map((i) =>
      i.itemId === itemId
        ? { ...i, [field]: value, notifiedHigh: field === "thresholdHigh" ? false : i.notifiedHigh, notifiedLow: field === "thresholdLow" ? false : i.notifiedLow }
        : i
    ));
  }, []);

  return { items, prices, addItem, removeItem, updateThreshold };
}
