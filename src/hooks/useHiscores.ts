import { useState, useEffect, useCallback } from "react";
import { fetchHiscores, detectIronmanType, type HiscoreData, type IronmanType } from "../lib/api/hiscores";

const STORAGE_KEY = "runewise_rsn";

export function useHiscores() {
  const [rsn, setRsn] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [data, setData] = useState<HiscoreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ironmanType, setIronmanType] = useState<IronmanType>("none");

  const lookup = useCallback(async (name: string) => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchHiscores(name.trim());
      setData(result);
      setRsn(name.trim());
      localStorage.setItem(STORAGE_KEY, name.trim());
      // Detect ironman status in background (non-blocking)
      detectIronmanType(name.trim()).then(setIronmanType);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setRsn("");
    setData(null);
    setError(null);
    setIronmanType("none");
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (rsn) lookup(rsn);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { rsn, data, loading, error, lookup, clear, ironmanType };
}
