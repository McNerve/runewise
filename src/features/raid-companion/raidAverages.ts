/**
 * Wiki-approximate average split times (ms) keyed by room name.
 *
 * CoX caveat: Chambers of Xeric is randomized — not every room appears every
 * raid, order varies, and scavenger/storage units are omitted. Averages are
 * rough mid-skill team ballparks for common combat/puzzle rooms only.
 */
export const WIKI_AVERAGES: Record<"cox" | "tob" | "toa", Record<string, number>> = {
  cox: {
    Tekton: 180_000,
    "Ice Demon": 120_000,
    "Lizardman Shamans": 150_000,
    Vanguards: 240_000,
    "Vasa Nistirio": 180_000,
    Vespula: 210_000,
    Muttadiles: 150_000,
    Guardians: 120_000,
    Crabs: 90_000,
    Thieving: 90_000,
    Tightrope: 60_000,
    "Great Olm": 300_000,
  },
  tob: {
    "The Maiden of Sugadinti": 210_000,
    "Pestilent Bloat": 240_000,
    "Nylocas Vasilias": 180_000,
    Sotetseg: 270_000,
    Xarpus: 300_000,
    "Verzik Vitur": 360_000,
  },
  toa: {
    Akkha: 180_000,
    "Ba-Ba": 120_000,
    Kephri: 150_000,
    Zebak: 240_000,
    "Het's Obelisk": 180_000,
    "Apmeken's Puzzle": 120_000,
    "Scabaras' Puzzle": 150_000,
    "Crondis' Puzzle": 120_000,
    "The Wardens": 360_000,
  },
};

/** Format a signed vs-average delta for display. Faster than avg → negative. */
export function formatVsAvg(diffMs: number, formatTime: (ms: number) => string): string {
  if (diffMs === 0) return formatTime(0);
  const sign = diffMs > 0 ? "+" : "-";
  return `${sign}${formatTime(Math.abs(diffMs))}`;
}

/** Look up wiki average for a room; null if unknown. */
export function wikiAvgForRoom(
  raidId: "cox" | "tob" | "toa",
  roomName: string
): number | null {
  const avg = WIKI_AVERAGES[raidId]?.[roomName];
  return avg != null && Number.isFinite(avg) ? avg : null;
}
