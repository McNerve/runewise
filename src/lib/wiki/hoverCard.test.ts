import { describe, expect, it } from "vitest";
import { buildHoverFacts } from "./hoverCard";

describe("buildHoverFacts", () => {
  it("leads with GE / alch / limit then infobox fields, capped at 4", () => {
    const facts = buildHoverFacts({
      summary: {
        title: "Dragon scimitar",
        summary: "A scimitar.",
        image: null,
        fields: [
          { label: "Released", value: "29 March 2005" },
          { label: "Members", value: "Yes" },
          { label: "Quest", value: "No" },
        ],
      },
      ge: { price: 59_000, alch: 60_000, limit: 70 },
    });
    expect(facts[0]).toMatch(/^GE /);
    expect(facts[1]).toMatch(/^Alch /);
    expect(facts[2]).toMatch(/^Limit /);
    expect(facts).toHaveLength(4);
    expect(facts[3]).toContain("Released");
  });

  it("works without GE data", () => {
    const facts = buildHoverFacts({
      summary: {
        title: "Vorkath",
        summary: "A dragon.",
        image: null,
        fields: [{ label: "Combat level", value: "732" }],
      },
      ge: null,
    });
    expect(facts).toEqual(["Combat level 732"]);
  });
});
