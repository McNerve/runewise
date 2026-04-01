export function formatGp(gp: number | null): string {
  if (gp == null) return "\u2014";
  if (gp >= 1_000_000) return `${(gp / 1_000_000).toFixed(1)}M`;
  if (gp >= 1_000) return `${(gp / 1_000).toFixed(0)}K`;
  return gp.toLocaleString();
}

export function timeAgo(unixSeconds: number | null): string {
  if (!unixSeconds) return "";
  const diff = Math.floor(Date.now() / 1000 - unixSeconds);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}
