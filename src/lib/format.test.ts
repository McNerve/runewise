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

  it("1000 returns '1K'", () => {
    expect(formatGp(1000)).toBe("1K");
  });

  it("1500 returns '2K' (rounded)", () => {
    expect(formatGp(1500)).toBe("2K");
  });

  it("999_999 returns '1000K'", () => {
    expect(formatGp(999_999)).toBe("1000K");
  });

  it("1_000_000 returns '1.0M'", () => {
    expect(formatGp(1_000_000)).toBe("1.0M");
  });

  it("1_500_000 returns '1.5M'", () => {
    expect(formatGp(1_500_000)).toBe("1.5M");
  });

  it("1_000_000_000 returns '1000.0M'", () => {
    expect(formatGp(1_000_000_000)).toBe("1000.0M");
  });

  it("negative values use toLocaleString (no suffix)", () => {
    // Negative values don't hit >= thresholds, so they fall through
    expect(formatGp(-2_500_000)).toBe((-2_500_000).toLocaleString());
    expect(formatGp(-5000)).toBe((-5000).toLocaleString());
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
