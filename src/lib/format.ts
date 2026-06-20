export function formatGp(gp: number | null): string {
  if (gp == null) return "\u2014";
  const sign = gp < 0 ? "-" : "";
  const abs = Math.abs(gp);
  // Round DOWN throughout so a margin is never overstated, and keep one
  // decimal in the low-K range where flip/alch profits actually live.
  if (abs >= 999_950_000) return `${sign}${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 999_500) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 100_000) return `${sign}${Math.floor(abs / 1_000)}K`;
  if (abs >= 1_000) return `${sign}${(Math.floor(abs / 100) / 10).toFixed(1)}K`;
  return gp.toLocaleString();
}

export function timeAgo(unixSeconds: number | null): string {
  if (!unixSeconds) return "";
  const diff = Math.floor(Date.now() / 1000 - unixSeconds);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}
