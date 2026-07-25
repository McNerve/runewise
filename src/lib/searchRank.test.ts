import { describe, it, expect } from "vitest";
import { rankSearchResults, scoreSearchResult } from "./searchRank";
import type { SearchResult } from "./search";

function r(partial: Partial<SearchResult> & Pick<SearchResult, "name" | "view">): SearchResult {
  return {
    category: partial.category ?? "Test",
    kind: partial.kind,
    searchText: partial.searchText,
    params: partial.params,
    ...partial,
    name: partial.name,
    view: partial.view,
  };
}

describe("search ranking", () => {
  it("ranks Budget Loadout Finder above Lookup player for 'loadout'", () => {
    const results = [
      r({
        name: 'Lookup player "loadout"',
        kind: "Player",
        category: "Shortcut",
        view: "lookup",
        params: { query: "loadout" },
      }),
      r({
        name: "Budget Loadout Finder",
        kind: "View",
        category: "Combat",
        view: "loadout-finder",
        searchText: "budget loadout finder gear finder bis budget under budget",
      }),
      r({
        name: "Search wiki for \"loadout\"",
        kind: "Wiki",
        category: "Shortcut",
        view: "wiki",
      }),
    ];
    const ranked = rankSearchResults(results, "loadout");
    expect(ranked[0]?.view).toBe("loadout-finder");
    expect(ranked[0]?.kind).toBe("View");
  });

  it("scores View kind higher than Player shortcut", () => {
    const view = scoreSearchResult(
      r({
        name: "DPS Calculator",
        kind: "View",
        view: "dps-calc",
        searchText: "dps damage loadout",
      }),
      "dps"
    );
    const player = scoreSearchResult(
      r({
        name: 'Lookup player "dps"',
        kind: "Player",
        view: "lookup",
      }),
      "dps"
    );
    expect(view).toBeGreaterThan(player);
  });
});
