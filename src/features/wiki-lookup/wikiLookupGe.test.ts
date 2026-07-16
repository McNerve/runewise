import { describe, it, expect } from "vitest";
import { buildGeSnapshot, wikiKindLabel } from "./wikiLookupGe";
import type { ItemMapping } from "../../lib/api/ge";

const mapping: ItemMapping[] = [
  {
    id: 4151,
    name: "Abyssal whip",
    examine: "A weapon from the abyss.",
    members: true,
    lowalch: 1,
    highalch: 1,
    limit: 70,
    value: 1,
    icon: "Abyssal_whip.png",
  },
  {
    id: 1,
    name: "Untradeable thing",
    examine: "no market",
    members: true,
    lowalch: null,
    highalch: null,
    limit: null,
    value: 0,
    icon: "",
  },
];

describe("buildGeSnapshot", () => {
  it("returns null when page is not in mapping", () => {
    expect(buildGeSnapshot("Twisted bow", mapping, {})).toBeNull();
  });

  it("returns null for untradeable with no price/limit", () => {
    expect(buildGeSnapshot("Untradeable thing", mapping, {})).toBeNull();
  });

  it("builds snapshot with price, limit, and volume", () => {
    const snap = buildGeSnapshot(
      "Abyssal whip",
      mapping,
      { "4151": { high: 2_000_000, low: 1_900_000, highTime: null, lowTime: null } },
      { "4151": 12_345 }
    );
    expect(snap).toEqual({
      price: 2_000_000,
      buyLimit: 70,
      dailyVolume: 12_345,
    });
  });
});

describe("wikiKindLabel", () => {
  it("labels entity kinds", () => {
    expect(wikiKindLabel("item")).toBe("Item");
    expect(wikiKindLabel("boss")).toBe("Boss");
    expect(wikiKindLabel("quest")).toBe("Quest");
    expect(wikiKindLabel("other")).toBe("Wiki");
  });
});
