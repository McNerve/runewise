import { describe, expect, it } from "vitest";
import {
  FEATURE_FAMILIES,
  SEARCHABLE_FEATURES,
  SIDEBAR_FEATURES,
  getFeature,
} from "./features";

describe("feature registry", () => {
  it("groups sidebar features into ordered hubs", () => {
    expect(FEATURE_FAMILIES).toEqual([
      "Home",
      "Player",
      "Combat",
      "Market",
      "Plan",
      "Live",
    ]);
  });

  it("includes the dedicated player lookup view", () => {
    expect(getFeature("lookup").title).toBe("Hiscores Lookup");
    expect(SEARCHABLE_FEATURES.some((feature) => feature.id === "lookup")).toBe(
      true
    );
  });

  it("keeps secondary tools searchable but off the main sidebar", () => {
    const secondary = [
      "lookup",
      "dry-calc",
      "pet-calc",
      "production-calc",
      "shop-helper",
      "kingdom",
      "spells",
      "world-map",
      "news",
      "gear-compare",
      "raids",
      "flip-journal",
      "clue-helper",
      "collection-log",
    ] as const;
    for (const id of secondary) {
      expect(getFeature(id).sidebar).toBe(false);
      expect(getFeature(id).search).toBe(true);
    }
    // Daily drivers stay visible — IA trim, not a dead product.
    expect(SIDEBAR_FEATURES.some((f) => f.id === "dps-calc")).toBe(true);
    expect(SIDEBAR_FEATURES.some((f) => f.id === "market")).toBe(true);
    expect(SIDEBAR_FEATURES.some((f) => f.id === "bosses")).toBe(true);
    expect(SIDEBAR_FEATURES.some((f) => f.id === "money-making")).toBe(true);
    expect(SIDEBAR_FEATURES.some((f) => f.id === "skill-calc")).toBe(true);
    // Focused rail: daily drivers only (Home + hubs).
    expect(SIDEBAR_FEATURES.length).toBeLessThanOrEqual(16);
  });
});

