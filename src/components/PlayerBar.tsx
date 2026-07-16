import { memo, useState, useEffect } from "react";
import { useNavigation } from "../lib/NavigationContext";
import { getFeature } from "../lib/features";
import { Button } from "./primitives";

interface PlayerBarProps {
  rsn: string;
  loading: boolean;
  error: string | null;
  onLookup: (rsn: string) => void;
  onClear: () => void;
}

const PlayerBar = memo(function PlayerBar({
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
    setInput(rsn); // eslint-disable-line react-hooks/set-state-in-effect
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
    <div className="topbar-shell shrink-0">
      <div className="h-[4.25rem] flex items-center px-5 sm:px-7">
        <div className="flex items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-3 min-w-0">
            {canGoBack && (
              <button
                type="button"
                onClick={goBack}
                className="pressable flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-bg-tertiary/60 text-text-secondary hover:border-border hover:bg-bg-secondary hover:text-text-primary"
                title="Go back"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
              </button>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="section-kicker">{feature.family}</span>
                {loading && (
                  <span className="w-3 h-3 border-2 border-warning/30 border-t-warning rounded-full animate-spin" />
                )}
              </div>
              <h2 className="display-face truncate text-[1.25rem] font-semibold tracking-tight text-text-primary leading-tight mt-0.5">
                {feature.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {rsn && !editing ? (
              <button
                onClick={() => setEditing(true)}
                className="pressable flex items-center gap-2.5 rounded-xl border border-accent/35 bg-accent/12 px-3 py-2 text-sm font-semibold text-accent hover:bg-accent/18"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/20 text-[11px] font-bold">
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
                  className="w-44 rounded-xl border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none transition-[border-color,box-shadow] duration-150 ease placeholder:text-text-tertiary focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_18%,transparent)]"
                />
                <Button variant="primary" type="submit" disabled={loading || !input.trim()}>
                  Set
                </Button>
                {rsn && (
                  <button
                    onClick={handleClear}
                    type="button"
                    className="pressable rounded-xl border border-border px-2.5 py-2 text-xs text-text-secondary hover:border-danger/35 hover:text-danger"
                  >
                    Clear
                  </button>
                )}
                {editing && (
                  <button
                    onClick={() => setEditing(false)}
                    type="button"
                    className="text-xs text-text-secondary hover:text-text-primary transition-colors duration-150 px-1"
                  >
                    Cancel
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mx-5 sm:mx-7 mb-3 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger"
        >
          {error}
        </div>
      )}
    </div>
  );
});

export default PlayerBar;
