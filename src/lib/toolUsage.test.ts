import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getToolFrequency,
  loadPinnedTools,
  recordToolHit,
  savePinnedTools,
  togglePinnedTool,
} from "./toolUsage";

describe("toolUsage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-17T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("records and counts hits", () => {
    recordToolHit("dps-calc");
    recordToolHit("dps-calc");
    recordToolHit("bosses");
    const freq = getToolFrequency();
    expect(freq.get("dps-calc")).toBe(2);
    expect(freq.get("bosses")).toBe(1);
  });

  it("drops hits outside the 30-day window", () => {
    recordToolHit("slayer");
    // Advance 31 days so the hit falls outside the rolling window.
    vi.setSystemTime(new Date("2026-05-18T12:00:00Z"));
    expect(getToolFrequency().get("slayer")).toBeUndefined();
  });

  it("round-trips pinned tools via save/load", () => {
    savePinnedTools(["slayer", "bosses"]);
    expect(loadPinnedTools()).toEqual(["slayer", "bosses"]);
  });

  it("togglePinnedTool adds then removes", () => {
    const after = togglePinnedTool("market");
    expect(after).toEqual(["market"]);
    const again = togglePinnedTool("market");
    expect(again).toEqual([]);
  });
});
