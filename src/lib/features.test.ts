import { describe, expect, it } from "vitest";
import { FEATURE_FAMILIES, SEARCHABLE_FEATURES, getFeature } from "./features";

describe("feature registry", () => {
  it("groups sidebar features into ordered hubs", () => {
    expect(FEATURE_FAMILIES).toEqual([
      "Home",
      "Player",
      "Combat",
      "Market",
      "Calculators",
      "Live",
    ]);
  });

  it("includes the dedicated player lookup view", () => {
    expect(getFeature("lookup").title).toBe("Hiscores Lookup");
    expect(SEARCHABLE_FEATURES.some((feature) => feature.id === "lookup")).toBe(
      true
    );
  });
});
