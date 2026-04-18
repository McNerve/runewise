import { describe, expect, it } from "vitest";
import { buildSearchIndex } from "./search";

describe("buildSearchIndex", () => {
  it("finds Zulrah when querying 'magic weak'", async () => {
    const index = await buildSearchIndex();
    const zulrah = index.find((r) => r.name === "Zulrah");
    expect(zulrah).toBeDefined();
    expect(zulrah?.searchText?.toLowerCase()).toContain("magic");
    expect(zulrah?.searchText?.toLowerCase()).toContain("weak");
  });

  it("finds Zulrah when searching for 'weak to magic'", async () => {
    const index = await buildSearchIndex();
    const q = "weak to magic";
    const matches = index.filter((r) =>
      `${r.name} ${r.category} ${r.searchText ?? ""}`.toLowerCase().includes(q)
    );
    expect(matches.some((r) => r.name === "Zulrah")).toBe(true);
  });

  it("finds Quest Tracker sub-tab for query 'quest'", async () => {
    const index = await buildSearchIndex();
    const q = "quest";
    const matches = index.filter((r) =>
      `${r.name} ${r.category} ${r.searchText ?? ""}`.toLowerCase().includes(q)
    );
    expect(matches.some((r) => r.name === "Quest Tracker")).toBe(true);
  });

  it("finds Diary Tracker sub-tab for query 'diary'", async () => {
    const index = await buildSearchIndex();
    const matches = index.filter((r) =>
      `${r.name} ${r.category} ${r.searchText ?? ""}`.toLowerCase().includes("diary")
    );
    expect(matches.some((r) => r.name === "Diary Tracker")).toBe(true);
  });
});
