import { describe, it, expect } from "vitest";
import { parseRate } from "./parseRate";

describe("parseRate", () => {
  it.each([
    ["Always", 1],
    ["1/128", 128],
    ["1/9,000,000", 9_000_000],
    ["~1/512.4", 512.4],
    ["3/128", 128 / 3],
    ["2 × 1/128", 64],
    ["2 x 1/128", 64],
  ])("parses %s → 1/%s", (input, expected) => {
    expect(parseRate(input)).toBeCloseTo(expected as number, 2);
  });

  it.each([["Varies"], ["Common"], ["0/128"], ["1/0"], [""]])(
    "returns null for %s",
    (input) => {
      expect(parseRate(input)).toBeNull();
    }
  );

  it("survives pathologically long strings without stalling", () => {
    const start = performance.now();
    parseRate("9".repeat(100_000) + "/");
    expect(performance.now() - start).toBeLessThan(100);
  });
});
