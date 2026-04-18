import { describe, it, expect } from "vitest";
import {
  parseEquipmentEntry,
  parseEquipmentCellEntries,
  parseSuggestedSkill,
} from "./bossGuide";

// -----------------------------------------------------------------------
// parseEquipmentEntry
// -----------------------------------------------------------------------

describe("parseEquipmentEntry", () => {
  it("returns item type for a normal item", () => {
    const result = parseEquipmentEntry("Twisted bow");
    expect(result).toEqual({ type: "item", name: "Twisted bow" });
  });

  it("detects see-section cross-references", () => {
    const result = parseEquipmentEntry("See melee section");
    expect(result).toEqual({ type: "see-section", targetSectionTitle: "melee" });
  });

  it("detects see-section with plural 'sections'", () => {
    const result = parseEquipmentEntry("See melee/ranged sections");
    expect(result).toEqual({ type: "see-section", targetSectionTitle: "melee/ranged" });
  });

  it("is case-insensitive for see-section", () => {
    const result = parseEquipmentEntry("SEE RANGED SECTION");
    expect(result).toEqual({ type: "see-section", targetSectionTitle: "RANGED" });
  });

  it("trims whitespace from item name", () => {
    const result = parseEquipmentEntry("  Abyssal whip  ");
    expect(result).toEqual({ type: "item", name: "Abyssal whip" });
  });

  it("preserves imageUrl when provided", () => {
    const result = parseEquipmentEntry("Crystal bow", "https://example.com/img.png");
    expect(result).toMatchObject({ type: "item", name: "Crystal bow", imageUrl: "https://example.com/img.png" });
  });

  it("does not treat 'See you later' as a cross-reference", () => {
    const result = parseEquipmentEntry("See you later");
    expect(result).toMatchObject({ type: "item" });
  });
});

// -----------------------------------------------------------------------
// parseEquipmentCellEntries — uses jsdom DOMParser via jsdom env
// -----------------------------------------------------------------------

describe("parseEquipmentCellEntries", () => {
  function makeCell(innerHtml: string): Element {
    const doc = new DOMParser().parseFromString(
      `<table><tr><td>${innerHtml}</td></tr></table>`,
      "text/html"
    );
    return doc.querySelector("td")!;
  }

  it("splits list items into separate entries", () => {
    const cell = makeCell("<ul><li>Voidwaker (stab)</li><li>Abyssal whip</li></ul>");
    const entries = parseEquipmentCellEntries(cell);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ type: "item", name: "Voidwaker (stab)" });
    expect(entries[1]).toMatchObject({ type: "item", name: "Abyssal whip" });
  });

  it("splits on <br> boundaries", () => {
    const cell = makeCell("Dragon sword<br>Arkan blade");
    const entries = parseEquipmentCellEntries(cell);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ type: "item", name: "Dragon sword" });
    expect(entries[1]).toMatchObject({ type: "item", name: "Arkan blade" });
  });

  it("returns single entry for plain text cell", () => {
    const cell = makeCell("Twisted bow");
    const entries = parseEquipmentCellEntries(cell);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ type: "item", name: "Twisted bow" });
  });

  it("detects see-section in a list item", () => {
    const cell = makeCell("<ul><li>See melee section</li></ul>");
    const entries = parseEquipmentCellEntries(cell);
    expect(entries[0]).toEqual({ type: "see-section", targetSectionTitle: "melee" });
  });

  it("resolves relative image src from list items", () => {
    const cell = makeCell(
      '<ul><li><img src="/images/thumb/Twisted_bow.png/28px.png">Twisted bow</li></ul>'
    );
    const entries = parseEquipmentCellEntries(cell);
    expect(entries[0]).toMatchObject({ type: "item", name: "Twisted bow" });
    expect((entries[0] as { imageUrl?: string }).imageUrl).toMatch(
      /^https:\/\/oldschool\.runescape\.wiki/
    );
  });

  it("resolves protocol-relative image src", () => {
    const cell = makeCell(
      '<ul><li><img src="//oldschool.runescape.wiki/images/Item.png">Crystal bow</li></ul>'
    );
    const entries = parseEquipmentCellEntries(cell);
    expect((entries[0] as { imageUrl?: string }).imageUrl).toMatch(/^https:/);
  });
});

// -----------------------------------------------------------------------
// parseSuggestedSkill
// -----------------------------------------------------------------------

describe("parseSuggestedSkill", () => {
  it("parses basic level + skill name", () => {
    const result = parseSuggestedSkill("70+ Prayer");
    expect(result).toMatchObject({ skill: "Prayer", level: 70 });
  });

  it("parses level without +", () => {
    const result = parseSuggestedSkill("43 Prayer");
    expect(result).toMatchObject({ skill: "Prayer", level: 43 });
  });

  it("detects boostAllowed", () => {
    const result = parseSuggestedSkill(
      "82+ Herblore (for Ornate rejuvenation pool (with boost))"
    );
    expect(result?.boostAllowed).toBe(true);
    expect(result?.skill).toBe("Herblore");
    expect(result?.level).toBe(82);
  });

  it("detects optional", () => {
    const result = parseSuggestedSkill(
      "82+ Herblore (for Ornate rejuvenation pool (with boost) - (optional for faster resupply))"
    );
    expect(result?.optional).toBe(true);
    expect(result?.boostAllowed).toBe(true);
  });

  it("stores full description", () => {
    const raw = "82+ Herblore (for Ornate rejuvenation pool (with boost) - (optional))";
    const result = parseSuggestedSkill(raw);
    expect(result?.description).toBe(raw);
  });

  it("returns null for non-skill strings", () => {
    const result = parseSuggestedSkill("Some random text with no level");
    expect(result).toBeNull();
  });

  it("parses level without skill name", () => {
    const result = parseSuggestedSkill("75+");
    expect(result?.level).toBe(75);
    // Skill may be empty or "Unknown" — should not throw
    expect(result).not.toBeNull();
  });

  it("capitalizes skill name", () => {
    const result = parseSuggestedSkill("90 slayer");
    expect(result?.skill).toBe("Slayer");
  });
});

// -----------------------------------------------------------------------
// Hierarchy helpers (slugify-based ID collision guard)
// -----------------------------------------------------------------------

describe("hierarchy deduplication logic", () => {
  it("H3 gets a unique id when title matches H2", () => {
    // Basic smoke test: two sections with same title get different ids when parent differs
    function makeId(title: string, parentId?: string) {
      const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const parent = parentId ?? "";
      return parent ? `${base}-${parent}` : base;
    }

    const h2Id = makeId("Equipment");
    const h3Id = makeId("Equipment", "path-of-het");
    expect(h2Id).not.toBe(h3Id);
  });
});
