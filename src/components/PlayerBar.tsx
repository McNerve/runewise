import { useState, useEffect } from "react";
import { useNavigation } from "../lib/NavigationContext";
import { getFeature } from "../lib/features";

interface PlayerBarProps {
  rsn: string;
  loading: boolean;
  error: string | null;
  onLookup: (rsn: string) => void;
  onClear: () => void;
}

export default function PlayerBar({
  rsn,
  loading,
  error,
  onLookup,
  onClear,
}: PlayerBarProps) {
  const { view, goBack, canGoBack } = useNavigation();
  const [input, setInput] = useState(rsn);
  const [editing, setEditing] = useState(false);
  const feature = getFeature(view);

  useEffect(() => {
    setInput(rsn);
    if (rsn) setEditing(false);
  }, [rsn]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLookup(input);
    setEditing(false);
  };

  const handleClear = () => {
    setInput("");
    onClear();
    setEditing(false);
  };

  return (
    <div className="topbar-shell border-b border-border px-4 py-2.5 shrink-0">
      <div className="flex items-center justify-between gap-4">
        {/* Left: nav + title */}
        <div className="flex items-center gap-3 min-w-0">
          {canGoBack && (
            <button
              type="button"
              onClick={goBack}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-secondary transition hover:bg-bg-secondary hover:text-text-primary"
              title="Go back"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/50">{feature.family}</span>
              {loading && <span className="text-[10px] text-warning animate-pulse">Loading...</span>}
            </div>
            <h2 className="truncate text-base font-semibold tracking-tight">{feature.title}</h2>
          </div>
        </div>

        {/* Right: profile */}
        <div className="flex items-center gap-2 shrink-0">
          {rsn && !editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent transition hover:bg-accent/15"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-[10px] font-bold">
                {rsn[0].toUpperCase()}
              </span>
              {rsn}
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter RSN..."
                className="w-40 rounded-lg border border-border bg-bg-primary/80 px-2.5 py-1.5 text-sm text-text-primary outline-none transition placeholder:text-text-secondary/50 focus:border-accent"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-lg bg-accent px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                Set
              </button>
              {rsn && (
                <button
                  onClick={handleClear}
                  type="button"
                  className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-text-secondary transition hover:border-danger/30 hover:text-danger"
                >
                  Clear
                </button>
              )}
              {editing && (
                <button
                  onClick={() => setEditing(false)}
                  type="button"
                  className="text-xs text-text-secondary hover:text-text-primary transition"
                >
                  Cancel
                </button>
              )}
            </form>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs text-danger">
          {error}
        </div>
      )}
    </div>
  );
}
