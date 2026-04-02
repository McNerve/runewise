import { describe, expect, it } from "vitest";
import { FEATURE_FAMILIES, SEARCHABLE_FEATURES, getFeature } from "./features";

describe("feature registry", () => {
  it("exposes v1 families for sidebar grouping", () => {
    expect(FEATURE_FAMILIES).toEqual(
      expect.arrayContaining([
        "Player",
        "Tools",
        "Bossing",
        "Market",
        "Guides",
        "Live",
      ])
    );
  });

  it("includes the dedicated player lookup view", () => {
    expect(getFeature("lookup").title).toBe("Hiscores Lookup");
    expect(SEARCHABLE_FEATURES.some((feature) => feature.id === "lookup")).toBe(
      true
    );
  });
});
