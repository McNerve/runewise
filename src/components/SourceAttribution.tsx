interface SourceAttributionProps {
  source: string;
  fetchedAt?: number | null;
  cacheLabel?: string;
}

function formatRelativeTime(timestamp: number): string {
  const delta = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (delta < 60) return "just now";
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
  return `${Math.floor(delta / 86400)}d ago`;
}

export default function SourceAttribution({
  source,
  fetchedAt,
  cacheLabel,
}: SourceAttributionProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-secondary/70">
      <span className="rounded-full border border-border bg-bg-primary/60 px-2 py-1">
        Source: {source}
      </span>
      {fetchedAt ? (
        <span className="rounded-full border border-border bg-bg-primary/60 px-2 py-1">
          Refreshed {formatRelativeTime(fetchedAt)}
        </span>
      ) : null}
      {cacheLabel ? (
        <span className="rounded-full border border-border bg-bg-primary/60 px-2 py-1">
          Cache: {cacheLabel}
        </span>
      ) : null}
    </div>
  );
}
