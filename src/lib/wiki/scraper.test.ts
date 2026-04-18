import { describe, it, expect } from "vitest";
import {
  splitOnSlash,
  parseEquipmentCellEntries,
  parseLoadoutRowsWithEntries,
  parseSuggestedSkill,
  parseSuggestedSkillItems,
  isSuggestedSkillFallback,
} from "./scraper";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCell(html: string): Element {
  const doc = new DOMParser().parseFromString(
    `<table><tr><td>${html}</td></tr></table>`,
    "text/html"
  );
  return doc.querySelector("td")!;
}

function makeDoc(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

// ---------------------------------------------------------------------------
// splitOnSlash
// ---------------------------------------------------------------------------

describe("splitOnSlash", () => {
  it("splits two items separated by ' / '", () => {
    expect(splitOnSlash("Masori mask (f) / Void ranger helm")).toEqual([
      "Masori mask (f)",
      "Void ranger helm",
    ]);
  });

  it("trims trailing slash — 'Neitiznot faceguard /'", () => {
    expect(splitOnSlash("Neitiznot faceguard /")).toEqual(["Neitiznot faceguard"]);
  });

  it("trims leading slash — '/ Blessed coif'", () => {
    expect(splitOnSlash("/ Blessed coif")).toEqual(["Blessed coif"]);
  });

  it("does not split on a lone slash with no surrounding spaces", () => {
    // e.g. Bandos chestplate/Dragon platebody — shouldn't split
    expect(splitOnSlash("Bandos chestplate/Dragon platebody")).toEqual([
      "Bandos chestplate/Dragon platebody",
    ]);
  });

  it("returns single-element array when no separator present", () => {
    expect(splitOnSlash("Helm of neitiznot")).toEqual(["Helm of neitiznot"]);
  });

  it("handles 'Helm of neitiznot /' trailing slash", () => {
    expect(splitOnSlash("Helm of neitiznot /")).toEqual(["Helm of neitiznot"]);
  });

  it("drops empty parts after split", () => {
    expect(splitOnSlash(" / ")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// parseEquipmentCellEntries — Task 1 (slash split) + Task 2 (N/A filter)
// ---------------------------------------------------------------------------

describe("parseEquipmentCellEntries", () => {
  // Task 1 — slash-joined alternatives in linked items path
  it("splits slash-joined items when both are in a single link text", () => {
    const cell = makeCell(
      `<a href="/w/Masori_mask">Masori mask (f) / Void ranger helm</a>`
    );
    const entries = parseEquipmentCellEntries(cell);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ type: "item", text: "Masori mask (f)" });
    expect(entries[1]).toMatchObject({ type: "item", text: "Void ranger helm" });
  });

  it("handles trailing slash in linked item text", () => {
    const cell = makeCell(`<a href="/w/Neitiznot">Neitiznot faceguard /</a>`);
    const entries = parseEquipmentCellEntries(cell);
    expect(entries).toHaveLength(1);
    expect(entries[0].text).toBe("Neitiznot faceguard");
  });

  it("handles leading slash in linked item text", () => {
    const cell = makeCell(`<a href="/w/Coif">/ Blessed coif</a>`);
    const entries = parseEquipmentCellEntries(cell);
    expect(entries).toHaveLength(1);
    expect(entries[0].text).toBe("Blessed coif");
  });

  it("splits two separate links for different items", () => {
    const cell = makeCell(
      `<a href="/w/Item1">Bandos chestplate</a> / <a href="/w/Item2">Torag platebody</a>`
    );
    const entries = parseEquipmentCellEntries(cell);
    expect(entries).toHaveLength(2);
    expect(entries[0].text).toBe("Bandos chestplate");
    expect(entries[1].text).toBe("Torag platebody");
  });

  it("does not split parenthetical content like 'Blade of saeldor (c) (Iorwerth)'", () => {
    const cell = makeCell(`<a href="/w/Blade">Blade of saeldor (c) (Iorwerth)</a>`);
    const entries = parseEquipmentCellEntries(cell);
    expect(entries).toHaveLength(1);
    expect(entries[0].text).toBe("Blade of saeldor (c) (Iorwerth)");
  });

  // Task 2 — INVALID_LOADOUT_LABELS filter
  it("filters out N/A entries (linked)", () => {
    const cell = makeCell(`<a href="/w/Slot">N/A</a>`);
    const entries = parseEquipmentCellEntries(cell);
    expect(entries).toHaveLength(0);
  });

  it("filters out N/A entries (plain text fallback)", () => {
    const cell = makeCell(`N/A`);
    const entries = parseEquipmentCellEntries(cell);
    expect(entries).toHaveLength(0);
  });

  it("filters 'See Ranged' from linked items", () => {
    const cell = makeCell(`<a href="#">See Ranged</a>`);
    const entries = parseEquipmentCellEntries(cell);
    expect(entries).toHaveLength(0);
  });

  it("keeps valid items adjacent to N/A", () => {
    const cell = makeCell(
      `<a href="/w/Fury">Amulet of fury</a><a href="/w/na">N/A</a>`
    );
    const entries = parseEquipmentCellEntries(cell);
    expect(entries).toHaveLength(1);
    expect(entries[0].text).toBe("Amulet of fury");
  });

  it("tags see-section entries with type 'see-section'", () => {
    const cell = makeCell(`<a href="#">See melee section</a>`);
    const entries = parseEquipmentCellEntries(cell);
    // "See melee section" — doesn't match invalid labels directly but matches see-section pattern
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe("see-section");
  });

  it("does not filter see-section entries via invalid label list", () => {
    // "see ranged" is in INVALID_LOADOUT_LABELS — but the text "See ranged" should be caught
    // as an invalid label and dropped (not kept as see-section) since it's ambiguous.
    // Confirm the behaviour is consistent: see-section pattern wins when it has extra words.
    const cell = makeCell(`<a href="#">See ranged equipment</a>`);
    const entries = parseEquipmentCellEntries(cell);
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe("see-section");
  });

  it("deduplicates items that appear twice", () => {
    const cell = makeCell(
      `<a href="/w/Item">Bandos boots</a><a href="/w/Item">Bandos boots</a>`
    );
    const entries = parseEquipmentCellEntries(cell);
    expect(entries).toHaveLength(1);
  });

  it("attaches icon only to first split part", () => {
    const cell = makeCell(
      `<a href="/w/Item"><img src="masori.png" />Masori mask (f) / Void ranger helm</a>`
    );
    const entries = parseEquipmentCellEntries(cell);
    expect(entries).toHaveLength(2);
    expect(entries[0].icon).toBe("masori.png");
    expect(entries[1].icon).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// parseLoadoutRowsWithEntries
// ---------------------------------------------------------------------------

describe("parseLoadoutRowsWithEntries", () => {
  it("parses a simple two-column equipment table", () => {
    const doc = makeDoc(`
      <table>
        <tr><th>Slot</th><th>Item</th></tr>
        <tr>
          <td>Head</td>
          <td><a href="/w/Bandos">Neitiznot faceguard</a></td>
        </tr>
      </table>
    `);
    const rows = parseLoadoutRowsWithEntries(doc);
    expect(rows).toHaveLength(1);
    expect(rows[0].slot.text).toBe("Head");
    expect(rows[0].options[0].text).toBe("Neitiznot faceguard");
  });

  it("drops rows where all items are N/A", () => {
    const doc = makeDoc(`
      <table>
        <tr><th>Slot</th><th>Item</th></tr>
        <tr><td>Neck</td><td>N/A</td></tr>
        <tr><td>Head</td><td><a href="/w/Neit">Neitiznot faceguard</a></td></tr>
      </table>
    `);
    const rows = parseLoadoutRowsWithEntries(doc);
    expect(rows).toHaveLength(1);
    expect(rows[0].slot.text).toBe("Head");
  });

  it("splits slash items across columns", () => {
    const doc = makeDoc(`
      <table>
        <tr><th>Slot</th><th>Option 1</th><th>Option 2</th></tr>
        <tr>
          <td>Helm</td>
          <td><a href="#">Masori mask (f) / Void ranger helm</a></td>
          <td><a href="#">Blessed coif</a></td>
        </tr>
      </table>
    `);
    const rows = parseLoadoutRowsWithEntries(doc);
    expect(rows).toHaveLength(1);
    // "Masori mask (f)", "Void ranger helm", "Blessed coif" — 3 options
    expect(rows[0].options).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// parseSuggestedSkill — Task 3
// ---------------------------------------------------------------------------

describe("parseSuggestedSkill", () => {
  it("extracts a named skill with level", () => {
    const result = parseSuggestedSkill("85+ Ranged");
    expect(isSuggestedSkillFallback(result)).toBe(false);
    if (!isSuggestedSkillFallback(result)) {
      expect(result.skill).toBe("Ranged");
      expect(result.level).toBe(85);
    }
  });

  it("extracts Prayer for 'Piety' keyword", () => {
    const result = parseSuggestedSkill("70+ for Piety");
    expect(isSuggestedSkillFallback(result)).toBe(false);
    if (!isSuggestedSkillFallback(result)) {
      expect(result.skill).toBe("Prayer");
      expect(result.level).toBe(70);
    }
  });

  it("extracts Prayer for 'Rigour' keyword", () => {
    const result = parseSuggestedSkill("74+ for Rigour");
    expect(isSuggestedSkillFallback(result)).toBe(false);
    if (!isSuggestedSkillFallback(result)) {
      expect(result.skill).toBe("Prayer");
    }
  });

  it("extracts Ranged for 'ranged method' phrase", () => {
    const result = parseSuggestedSkill("Ranged method recommended");
    expect(isSuggestedSkillFallback(result)).toBe(false);
    if (!isSuggestedSkillFallback(result)) {
      expect(result.skill).toBe("Ranged");
    }
  });

  it("extracts Construction for 'ornate rejuvenation pool'", () => {
    const result = parseSuggestedSkill("82+ Ornate rejuvenation pool");
    expect(isSuggestedSkillFallback(result)).toBe(false);
    if (!isSuggestedSkillFallback(result)) {
      expect(result.skill).toBe("Construction");
      expect(result.level).toBe(82);
    }
  });

  it("returns fallback shape for unresolvable prose — not Unknown", () => {
    const result = parseSuggestedSkill("For 70+ best in slot gear");
    expect(isSuggestedSkillFallback(result)).toBe(true);
    if (isSuggestedSkillFallback(result)) {
      expect(result.fallback).toBeTruthy();
      expect(result.fallback).not.toContain("Unknown");
    }
  });

  it("returns fallback shape for 'Melee method' — no 'Unknown' skill", () => {
    const result = parseSuggestedSkill("Melee method preferred");
    // "melee method" → Attack via keyword map
    expect(isSuggestedSkillFallback(result)).toBe(false);
    if (!isSuggestedSkillFallback(result)) {
      expect(result.skill).toBe("Attack");
    }
  });

  it("returns fallback for completely unrecognised text", () => {
    const result = parseSuggestedSkill("Some random prose with no skill info");
    expect(isSuggestedSkillFallback(result)).toBe(true);
    if (isSuggestedSkillFallback(result)) {
      // Must have a meaningful fallback string, not "Unknown"
      expect(result.fallback).not.toBe("Unknown");
      expect(result.fallback.length).toBeGreaterThan(0);
    }
  });

  it("passes icon through to fallback shape", () => {
    const result = parseSuggestedSkill("Completely unresolvable text here", "icon.png");
    expect(isSuggestedSkillFallback(result)).toBe(true);
    if (isSuggestedSkillFallback(result)) {
      expect(result.icon).toBe("icon.png");
    }
  });

  it("handles no level gracefully", () => {
    const result = parseSuggestedSkill("High Slayer level recommended");
    expect(isSuggestedSkillFallback(result)).toBe(false);
    if (!isSuggestedSkillFallback(result)) {
      expect(result.skill).toBe("Slayer");
      // "High" doesn't contain a digit, so level may be null or from keyword
    }
  });
});

// ---------------------------------------------------------------------------
// parseSuggestedSkillItems
// ---------------------------------------------------------------------------

describe("parseSuggestedSkillItems", () => {
  it("parses a list of skill requirements", () => {
    const doc = makeDoc(`
      <ul>
        <li>85+ Ranged</li>
        <li>70+ Prayer (Piety)</li>
        <li>43+ Prayer</li>
      </ul>
    `);
    const results = parseSuggestedSkillItems(doc, "Suggested Skills");
    expect(results.length).toBeGreaterThanOrEqual(3);
    const ranged = results.find(
      (r) => !isSuggestedSkillFallback(r) && r.skill === "Ranged"
    );
    expect(ranged).toBeDefined();
  });

  it("never emits a result with skill === 'Unknown'", () => {
    const doc = makeDoc(`
      <ul>
        <li>For 70+ Piety</li>
        <li>Ranged method preferred</li>
        <li>Something completely unresolvable</li>
      </ul>
    `);
    const results = parseSuggestedSkillItems(doc, "Suggested Skills");
    for (const r of results) {
      if (!isSuggestedSkillFallback(r)) {
        expect(r.skill).not.toBe("Unknown" as never);
      }
    }
  });

  it("filters out the section title if it appears as a paragraph", () => {
    const doc = makeDoc(`
      <p>Suggested Skills</p>
      <ul>
        <li>70+ Attack</li>
      </ul>
    `);
    const results = parseSuggestedSkillItems(doc, "Suggested Skills");
    // Should only have one result, not two
    expect(results).toHaveLength(1);
  });
});
