import { useEffect, useState } from "react";

interface FreshnessStripProps {
  updatedAt: Date | null;
  onRefresh: () => void | Promise<void>;
  cacheLabel?: string;
}

function formatRelative(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export default function FreshnessStrip({ updatedAt, onRefresh, cacheLabel }: FreshnessStripProps) {
  const [, setTick] = useState(0);

  // Re-render every 10s so relative time stays fresh
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-1.5 text-xs text-text-secondary/70">
      {updatedAt ? (
        <span>Updated {formatRelative(updatedAt)}</span>
      ) : (
        <span>Not yet fetched</span>
      )}
      <span aria-hidden>·</span>
      <button
        type="button"
        onClick={() => void onRefresh()}
        className="text-text-secondary/70 hover:text-warning transition-colors"
      >
        Refresh
      </button>
      {cacheLabel && (
        <>
          <span aria-hidden>·</span>
          <span>Cache {cacheLabel}</span>
        </>
      )}
    </div>
  );
}
