import { describe, it, expect, vi, afterEach } from "vitest";
import { formatGp, timeAgo } from "./format";

describe("formatGp", () => {
  it("null returns em dash", () => {
    expect(formatGp(null)).toBe("\u2014");
  });

  it("0 returns '0'", () => {
    expect(formatGp(0)).toBe("0");
  });

  it("999 returns locale-formatted number", () => {
    expect(formatGp(999)).toBe("999");
  });

  it("low-K range keeps one decimal, rounded down", () => {
    expect(formatGp(1000)).toBe("1.0K");
    expect(formatGp(1500)).toBe("1.5K"); // never "2K"
    expect(formatGp(1234)).toBe("1.2K"); // rounds down, never "1K"
    expect(formatGp(12_340)).toBe("12.3K");
  });

  it("100K+ range shows integer K, rounded down", () => {
    expect(formatGp(100_000)).toBe("100K");
    expect(formatGp(999_499)).toBe("999K"); // never "1000K"
  });

  it("rounds the just-under-1M boundary to '1.0M', not '1000K'", () => {
    expect(formatGp(999_999)).toBe("1.0M");
    expect(formatGp(999_500)).toBe("1.0M");
  });

  it("1_000_000 returns '1.0M'", () => {
    expect(formatGp(1_000_000)).toBe("1.0M");
  });

  it("1_500_000 returns '1.5M'", () => {
    expect(formatGp(1_500_000)).toBe("1.5M");
  });

  it("billions use a 'B' suffix", () => {
    expect(formatGp(1_000_000_000)).toBe("1.00B");
    expect(formatGp(1_516_700_000)).toBe("1.52B");
  });

  it("negative values keep their suffix with a leading minus", () => {
    expect(formatGp(-2_500_000)).toBe("-2.5M");
    expect(formatGp(-5000)).toBe("-5.0K");
  });

  it("small negative stays as-is", () => {
    const result = formatGp(-50);
    expect(result).toBe("-50");
  });
});

describe("timeAgo", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("null returns empty string", () => {
    expect(timeAgo(null)).toBe("");
  });

  it("0 returns empty string (falsy)", () => {
    expect(timeAgo(0)).toBe("");
  });

  it("30 seconds ago", () => {
    vi.useFakeTimers();
    const now = 1700000000;
    vi.setSystemTime(now * 1000);
    expect(timeAgo(now - 30)).toBe("30s ago");
  });

  it("5 minutes ago", () => {
    vi.useFakeTimers();
    const now = 1700000000;
    vi.setSystemTime(now * 1000);
    expect(timeAgo(now - 300)).toBe("5m ago");
  });

  it("2 hours ago", () => {
    vi.useFakeTimers();
    const now = 1700000000;
    vi.setSystemTime(now * 1000);
    expect(timeAgo(now - 7200)).toBe("2h ago");
  });

  it("exactly 60 seconds = 1m ago", () => {
    vi.useFakeTimers();
    const now = 1700000000;
    vi.setSystemTime(now * 1000);
    expect(timeAgo(now - 60)).toBe("1m ago");
  });

  it("exactly 3600 seconds = 1h ago", () => {
    vi.useFakeTimers();
    const now = 1700000000;
    vi.setSystemTime(now * 1000);
    expect(timeAgo(now - 3600)).toBe("1h ago");
  });
});
