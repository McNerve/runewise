import { describe, it, expect } from "vitest";
import {
  WIKI_AVERAGES,
  formatVsAvg,
  wikiAvgForRoom,
} from "./raidAverages";
import { COX_ROOMS } from "../raids/data/cox";
import { TOB_ROOMS } from "../raids/data/tob";
import { TOA_ROOMS } from "../raids/data/toa";

function formatTime(ms: number): string {
  if (ms < 0) return "-";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${sec}s`;
}

describe("WIKI_AVERAGES room key alignment", () => {
  it("has an average for every CoX room", () => {
    for (const room of COX_ROOMS) {
      expect(wikiAvgForRoom("cox", room.name), room.name).not.toBeNull();
    }
  });

  it("has an average for every ToB room", () => {
    for (const room of TOB_ROOMS) {
      expect(wikiAvgForRoom("tob", room.name), room.name).not.toBeNull();
    }
  });

  it("has an average for every ToA room", () => {
    for (const room of TOA_ROOMS) {
      expect(wikiAvgForRoom("toa", room.name), room.name).not.toBeNull();
    }
  });

  it("does not use sparse index arrays (keys are room names)", () => {
    expect(Object.keys(WIKI_AVERAGES.tob).length).toBe(TOB_ROOMS.length);
    expect(Object.keys(WIKI_AVERAGES.toa).length).toBe(TOA_ROOMS.length);
    expect(Object.keys(WIKI_AVERAGES.cox).length).toBe(COX_ROOMS.length);
  });
});

describe("formatVsAvg", () => {
  it("shows minus when faster than average (negative diff)", () => {
    expect(formatVsAvg(-30_000, formatTime)).toBe("-30s");
  });

  it("shows plus when slower than average", () => {
    expect(formatVsAvg(45_000, formatTime)).toBe("+45s");
  });

  it("shows zero without sign clutter", () => {
    expect(formatVsAvg(0, formatTime)).toBe("0s");
  });
});
