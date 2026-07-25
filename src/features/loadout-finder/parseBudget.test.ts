import { describe, it, expect } from "vitest";
import { parseBudgetInput } from "./parseBudget";

describe("parseBudgetInput", () => {
  it("parses plain and suffix amounts", () => {
    expect(parseBudgetInput("1000000")).toBe(1_000_000);
    expect(parseBudgetInput("75m")).toBe(75_000_000);
    expect(parseBudgetInput("1.5b")).toBe(1_500_000_000);
    expect(parseBudgetInput("250k")).toBe(250_000);
    expect(parseBudgetInput("1,000,000")).toBe(1_000_000);
  });

  it("rejects junk", () => {
    expect(parseBudgetInput("")).toBeNull();
    expect(parseBudgetInput("abc")).toBeNull();
    expect(parseBudgetInput("-5m")).toBeNull();
  });
});
