import { describe, expect, it } from "vitest";
import {
  findStarSiteMatch,
  getRankedTeleportsForLocation,
  getRankedTeleportsForLocationFromSites,
  getStarLocationBadge,
  getStarLocationMap,
} from "./stars";

describe("star location maps", () => {
  it("returns a wiki map tile for known locations", () => {
    const map = getStarLocationMap("Rimmington mine");
    expect(map).toContain("maps.runescape.wiki");
    expect(map).toContain(".png");
  });

  it("matches real live-call aliases to map tiles", () => {
    expect(getStarLocationMap("East Falador bank")).toBeTruthy();
    expect(getStarLocationMap("Shilo Village gem mine")).toBeTruthy();
    expect(getStarLocationMap("Dwarven mine next to edgeville")).toBeTruthy();
    expect(getStarLocationMap("East Lumbridge Swamp mine")).toBeTruthy();
    expect(getStarLocationMap("Canifis bank")).toBeTruthy();
    expect(getStarLocationMap("Wilderness Resource Area")).toBeTruthy();
    expect(getStarLocationMap("Salvager Overlook in Varlamore")).toBeTruthy();
    expect(getStarLocationMap("Chambers of Xeric bank")).toBeTruthy();
    expect(getStarLocationMap("Feldip Hills (aks fairy ring)")).toBeTruthy();
    expect(getStarLocationMap("Ardougne Monastery")).toBeTruthy();
    expect(getStarLocationMap("Theatre of Blood bank")).toBeTruthy();
    expect(getStarLocationMap("ice/ dwarf mine entrance")).toBeTruthy();
  });

  it("falls back for unknown locations", () => {
    expect(getStarLocationMap("Myths' Guild mine")).toBeTruthy();
  });
});

describe("ranked teleports", () => {
  it("ranks the strongest teleport first", () => {
    expect(getRankedTeleportsForLocation("Crafting Guild mine")).toEqual([
      { label: "Crafting cape teleport", priority: "best" },
      { label: "Falador teleport → run south", priority: "good" },
    ]);
  });

  it("ranks teleports for real live-call aliases", () => {
    expect(getRankedTeleportsForLocation("Theatre of Blood bank")).toEqual([
      { label: "Drakan's medallion → Ver Sinhaza", priority: "best" },
    ]);
    expect(getRankedTeleportsForLocation("Mount Karuulm bank")).toEqual([
      { label: "Fairy ring CIR", priority: "best" },
      { label: "Skills necklace → Farming Guild → run north", priority: "good" },
    ]);
    expect(getRankedTeleportsForLocation("Shayzien mine south of Kourend Castle")).toEqual([
      { label: "Xeric's talisman → Xeric's Heart", priority: "best" },
      { label: "Shayzien teleport → run south", priority: "good" },
    ]);
  });

  it("matches live locations against canonical star sites", () => {
    const sites = [
      { name: "West Falador mine", region: "Asgarnia", teleports: ["Falador teleport"] },
      { name: "Chambers of Xeric bank", region: "Kourend", teleports: ["Xeric's talisman → Xeric's Honour"] },
      { name: "Canifis bank", region: "Morytania", teleports: ["Kharyrll teleport (Ancient)"] },
    ];

    expect(findStarSiteMatch("East Falador bank", sites, "MINING_GUILD_ENTRANCE")?.name).toBe("West Falador mine");
    expect(findStarSiteMatch("Chambers of Xeric bank", sites)?.name).toBe("Chambers of Xeric bank");
    expect(findStarSiteMatch("Canifis mine", sites)?.name).toBe("Canifis bank");
    expect(
      getRankedTeleportsForLocationFromSites("Chambers of Xeric bank", sites)
    ).toEqual([{ label: "Xeric's talisman → Xeric's Honour", priority: "best" }]);
  });

  it("returns an empty list when no hints exist", () => {
    expect(getRankedTeleportsForLocation("Unknown crater")).toEqual([]);
  });

  it("builds a readable fallback badge when no map exists", () => {
    expect(getStarLocationBadge("Custodia Mountains mine")).toBe("CM");
    expect(getStarLocationBadge("Mine north-west of hunter guild")).toBe("NH");
    expect(getStarLocationBadge("East Falador bank")).toBe("EF");
  });
});
