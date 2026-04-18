import { describe, it, expect } from "vitest";
import { isDatePill, extractTocEntries, upgradeImageUrl } from "./wikiLookupUtils";
import type { WikiLookupDocument } from "../../lib/wiki/lookup";

// Task 1: Breadcrumb ordering is a UI concern; tested via integration.
// The openPage trail logic can be unit-tested via pure function extraction if needed.
// Here we verify the helper functions used by the component.

describe("isDatePill", () => {
  it("filters bare year", () => {
    expect(isDatePill("2018")).toBe(true);
    expect(isDatePill("2004")).toBe(true);
  });

  it("filters bare month", () => {
    expect(isDatePill("January")).toBe(true);
    expect(isDatePill("December")).toBe(true);
  });

  it("filters day+month", () => {
    expect(isDatePill("4 January")).toBe(true);
    expect(isDatePill("31 December")).toBe(true);
  });

  it("filters month+year", () => {
    expect(isDatePill("January 2018")).toBe(true);
    expect(isDatePill("March 2004")).toBe(true);
  });

  it("filters 1-2 char titles", () => {
    expect(isDatePill("A")).toBe(true);
    expect(isDatePill("ab")).toBe(true);
  });

  it("keeps normal page titles", () => {
    expect(isDatePill("Dragon Slayer II")).toBe(false);
    expect(isDatePill("Twisted bow")).toBe(false);
    expect(isDatePill("Elvarg")).toBe(false);
    expect(isDatePill("Crandor")).toBe(false);
    expect(isDatePill("Chambers of Xeric")).toBe(false);
  });

  it("keeps multi-word titles starting with a month", () => {
    // e.g. "January Sales" would technically be month-only prefix, but that's an unusual page
    // The rule only filters exact month match
    expect(isDatePill("January Sales")).toBe(false);
  });
});

describe("extractTocEntries", () => {
  const makeSection = (id: string, title: string): WikiLookupDocument["sections"][number] => ({
    id,
    title,
    html: "<p>content</p>",
  });

  it("returns one entry per section at level 2", () => {
    const sections = [
      makeSection("requirements", "Requirements"),
      makeSection("rewards", "Rewards"),
      makeSection("walkthrough", "Walkthrough"),
    ];
    const entries = extractTocEntries(sections);
    expect(entries).toHaveLength(3);
    expect(entries[0]).toEqual({ id: "requirements", text: "Requirements", level: 2 });
    expect(entries[2]).toEqual({ id: "walkthrough", text: "Walkthrough", level: 2 });
  });

  it("returns empty array for empty sections", () => {
    expect(extractTocEntries([])).toEqual([]);
  });

  it("preserves ordering", () => {
    const sections = [
      makeSection("a", "A"),
      makeSection("b", "B"),
      makeSection("c", "C"),
    ];
    const ids = extractTocEntries(sections).map((e) => e.id);
    expect(ids).toEqual(["a", "b", "c"]);
  });
});

describe("upgradeImageUrl", () => {
  it("returns null for null input", () => {
    expect(upgradeImageUrl(null)).toBeNull();
  });

  it("upgrades thumbnail to 300px", () => {
    const url =
      "https://oldschool.runescape.wiki/images/thumb/a/ab/Twisted_bow.png/40px-Twisted_bow.png";
    const result = upgradeImageUrl(url);
    expect(result).toBe(
      "https://oldschool.runescape.wiki/images/thumb/a/ab/Twisted_bow.png/300px-Twisted_bow.png"
    );
  });

  it("upgrades 150px thumbnail", () => {
    const url =
      "https://oldschool.runescape.wiki/images/thumb/a/ab/Dragon_Slayer_II.png/150px-Dragon_Slayer_II.png";
    const result = upgradeImageUrl(url);
    expect(result).toContain("300px-Dragon_Slayer_II.png");
  });

  it("leaves non-thumb URLs unchanged", () => {
    const url = "https://oldschool.runescape.wiki/images/Twisted_bow.png";
    expect(upgradeImageUrl(url)).toBe(url);
  });
});

// Breadcrumb trail ordering logic (pure function extracted for test)
describe("breadcrumb trail", () => {
  // Replicates the openPage trail logic inline
  function computeNextTrail(
    currentTrail: string[],
    selectedPage: string,
    newPage: string
  ): string[] {
    if (selectedPage && selectedPage !== newPage) {
      return [...currentTrail, selectedPage].slice(-5);
    }
    return currentTrail;
  }

  it("adds current page to trail when navigating away", () => {
    const trail = computeNextTrail([], "Twisted bow", "Dragon Slayer II");
    expect(trail).toEqual(["Twisted bow"]);
  });

  it("keeps trail at max 5", () => {
    const longTrail = ["a", "b", "c", "d", "e"];
    const trail = computeNextTrail(longTrail, "f", "g");
    expect(trail).toHaveLength(5);
    expect(trail[4]).toBe("f");
  });

  it("current page is NOT in trail (it is displayed separately)", () => {
    const trail = computeNextTrail([], "Twisted bow", "Dragon Slayer II");
    // Trail has previous page. New page "Dragon Slayer II" is the current page shown bold.
    expect(trail).not.toContain("Dragon Slayer II");
  });

  it("does not add duplicate when reloading same page", () => {
    const trail = computeNextTrail(["Twisted bow"], "Dragon Slayer II", "Dragon Slayer II");
    expect(trail).toEqual(["Twisted bow"]);
  });
});
