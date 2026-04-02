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
  const feature = getFeature(view);

  useEffect(() => {
    setInput(rsn);
  }, [rsn]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLookup(input);
  };

  const handleClear = () => {
    setInput("");
    onClear();
  };

  return (
    <div className="topbar-shell border-b border-border px-4 py-3 shrink-0">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="section-kicker">{feature.family}</div>
          <div className="flex flex-wrap items-center gap-2">
            {canGoBack ? (
              <button
                type="button"
                onClick={goBack}
                className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary transition hover:text-text-primary"
                title="Go back"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
              </button>
            ) : null}
            <h2 className="truncate text-base font-semibold tracking-tight">
              {feature.title}
            </h2>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-secondary/80">
            <span>
              Saved profile: <span className="text-text-primary/85">{rsn || "none"}</span>
            </span>
            <span className="text-text-secondary/45">•</span>
            <span>Cmd/Ctrl+K for global search</span>
            <span className="text-text-secondary/45">•</span>
            <span
              className={
                loading
                  ? "text-warning"
                  : error
                    ? "text-danger"
                    : "text-text-secondary/80"
              }
            >
              {loading ? "Profile loading" : error ? "Lookup issue" : "Desktop mode"}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="section-kicker">Saved RSN</label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onLookup(input); } }}
            placeholder="Enter username..."
            className="w-full rounded-xl border border-border bg-bg-primary/82 px-3 py-2 text-sm text-text-primary outline-none transition placeholder:text-text-secondary/65 focus:border-accent sm:w-52"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-accent px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? "Loading..." : "Set Profile"}
          </button>
          {rsn && !loading && !error ? (
            <button
              onClick={handleClear}
              className="rounded-xl border border-border px-3 py-2 text-xs text-text-secondary transition hover:border-danger/30 hover:text-danger"
              title="Clear saved RSN"
              type="button"
            >
              Clear
            </button>
          ) : null}
        </form>
      </div>

      {error ? (
        <div className="mt-3 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </div>
      ) : null}
    </div>
  );
}
