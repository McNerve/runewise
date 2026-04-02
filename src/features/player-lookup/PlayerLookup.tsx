import { useCallback, useEffect, useState } from "react";
import Overview from "../overview/Overview";
import { fetchHiscores, type HiscoreData } from "../../lib/api/hiscores";
import { useNavigation } from "../../lib/NavigationContext";
import EmptyState from "../../components/EmptyState";
import { NAV_ICONS } from "../../lib/sprites";

export default function PlayerLookup() {
  const { params } = useNavigation();
  const [query, setQuery] = useState(params.query ?? "");
  const [lookupRsn, setLookupRsn] = useState("");
  const [data, setData] = useState<HiscoreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    try {
      const result = await fetchHiscores(trimmed);
      setData(result);
      setLookupRsn(trimmed);
    } catch (lookupError) {
      setData(null);
      setLookupRsn(trimmed);
      setError(
        lookupError instanceof Error ? lookupError.message : "Failed to look up player"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!params.query) return;
    if (params.query === lookupRsn) return;
    setQuery(params.query);
    void handleLookup(params.query);
  }, [handleLookup, lookupRsn, params.query]);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Player Lookup</h2>
            <p className="max-w-2xl text-sm text-text-secondary">
              Inspect any OSRS player on demand without overwriting your saved RuneWise profile.
            </p>
          </div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-text-secondary/60">
            Read-only Hiscores view
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleLookup(query);
          }}
          className="mt-4 flex flex-col gap-3 md:flex-row"
        >
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search any player..."
            className="flex-1 rounded-xl border border-border bg-bg-primary px-4 py-3 text-sm outline-none transition focus:border-accent"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? "Looking up..." : "Lookup player"}
          </button>
        </form>

        {error ? (
          <div className="mt-3">
            <EmptyState
              icon={NAV_ICONS.lookup}
              title={`Could not find "${lookupRsn}"`}
              description={error}
            />
          </div>
        ) : null}
      </div>

      {!lookupRsn && !loading && !error ? (
        <EmptyState
          icon={NAV_ICONS.lookup}
          title="Search for a player"
          description="Look up any player to open a full profile snapshot. Your saved RSN in the command bar stays untouched."
        />
      ) : null}

      {loading && lookupRsn ? (
        <div className="py-8 text-sm text-text-secondary">
          Loading profile for {lookupRsn}...
        </div>
      ) : null}

      {data && lookupRsn ? <Overview hiscores={data} rsn={lookupRsn} /> : null}
    </div>
  );
}
