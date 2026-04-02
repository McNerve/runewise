import { describe, expect, it } from "vitest";
import { parseThresholdInput } from "./helpers";

describe("parseThresholdInput", () => {
  it("parses plain values", () => {
    expect(parseThresholdInput("250")).toBe(250);
    expect(parseThresholdInput("2,500")).toBe(2500);
  });

  it("parses shorthand suffixes", () => {
    expect(parseThresholdInput("250k")).toBe(250_000);
    expect(parseThresholdInput("12.5m")).toBe(12_500_000);
    expect(parseThresholdInput("1b")).toBe(1_000_000_000);
  });

  it("returns null for empty or invalid values", () => {
    expect(parseThresholdInput("")).toBeNull();
    expect(parseThresholdInput("abc")).toBeNull();
    expect(parseThresholdInput("12kk")).toBeNull();
  });
});
