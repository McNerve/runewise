import { describe, it, expect, beforeEach } from "vitest";
import { isComparisonTable, parseComparisonTable } from "../tables";

// Minimal fixture modelled on the Twisted bow page's Bows comparison table.
// Columns: Image | Name | Ranged bonus | Range str | Speed | Notes
const BOW_COMPARISON_HTML = `
<table class="wikitable">
  <caption>Bows comparison</caption>
  <thead>
    <tr>
      <th></th>
      <th>Name</th>
      <th>Ranged bonus</th>
      <th>Range str</th>
      <th>Speed</th>
      <th>Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><img src="https://oldschool.runescape.wiki/images/Twisted_bow.png" alt="Twisted bow"></td>
      <td><a href="/w/Twisted_bow">Twisted bow</a></td>
      <td>70</td>
      <td>20</td>
      <td>6</td>
      <td>Best-in-slot ranged weapon.</td>
    </tr>
    <tr>
      <td><img src="https://oldschool.runescape.wiki/images/Bow_of_faerdhinen.png" alt="Bow of faerdhinen"></td>
      <td><a href="/w/Bow_of_faerdhinen">Bow of faerdhinen</a></td>
      <td>80</td>
      <td>35</td>
      <td>5</td>
      <td>Requires <a href="/w/Song_of_the_Elves">Song of the Elves</a>.</td>
    </tr>
    <tr>
      <td><img src="https://oldschool.runescape.wiki/images/Magic_shortbow.png" alt="Magic shortbow"></td>
      <td><a href="/w/Magic_shortbow">Magic shortbow</a></td>
      <td>69</td>
      <td>0</td>
      <td>6</td>
      <td>Cheap option for lower levels.</td>
    </tr>
  </tbody>
</table>
`;

// A non-comparison table (no numeric columns)
const INFO_TABLE_HTML = `
<table class="wikitable">
  <tr><th>Drop</th><th>Rarity</th></tr>
  <tr><td>Dragon bones</td><td>Always</td></tr>
  <tr><td>Coins</td><td>Always</td></tr>
</table>
`;

// Stat-only table — no notes column
const STAT_TABLE_HTML = `
<table class="wikitable">
  <tr>
    <th>Weapon</th>
    <th>Attack speed</th>
    <th>Max hit</th>
    <th>Accuracy</th>
  </tr>
  <tr><td>Scythe of vitur</td><td>5</td><td>60</td><td>100</td></tr>
  <tr><td>Rapier</td><td>4</td><td>55</td><td>110</td></tr>
  <tr><td>Blade of saeldor</td><td>4</td><td>57</td><td>108</td></tr>
</table>
`;

function makeTable(html: string): HTMLTableElement {
  const div = document.createElement("div");
  div.innerHTML = html.trim();
  return div.querySelector("table") as HTMLTableElement;
}

describe("isComparisonTable", () => {
  it("detects bow comparison table", () => {
    expect(isComparisonTable(makeTable(BOW_COMPARISON_HTML))).toBe(true);
  });

  it("detects stat-only table as comparison", () => {
    expect(isComparisonTable(makeTable(STAT_TABLE_HTML))).toBe(true);
  });

  it("rejects a simple two-column info table", () => {
    expect(isComparisonTable(makeTable(INFO_TABLE_HTML))).toBe(false);
  });
});

describe("parseComparisonTable", () => {
  let table: HTMLTableElement;

  beforeEach(() => {
    table = makeTable(BOW_COMPARISON_HTML);
  });

  it("extracts caption", () => {
    const result = parseComparisonTable(table);
    expect(result.caption).toBe("Bows comparison");
  });

  it("extracts stat column headers (excluding first empty col)", () => {
    const result = parseComparisonTable(table);
    // columns should NOT include the first image cell but SHOULD include Name, stats — Notes excluded as it's a notes col
    expect(result.columns).toContain("Name");
    expect(result.columns).toContain("Ranged bonus");
    expect(result.columns).toContain("Range str");
    expect(result.columns).toContain("Speed");
    // Notes col not in columns array — it's in row.notes
    expect(result.columns).not.toContain("Notes");
  });

  it("extracts 3 rows", () => {
    const result = parseComparisonTable(table);
    expect(result.rows).toHaveLength(3);
  });

  it("parses first row correctly", () => {
    const result = parseComparisonTable(table);
    const row = result.rows[0];
    expect(row.name).toBe("Twisted bow");
    expect(row.image).toContain("Twisted_bow.png");
    expect(row.link).toContain("Twisted_bow");
    expect(row.stats["Ranged bonus"]).toBe(70);
    expect(row.stats["Range str"]).toBe(20);
    expect(row.stats["Speed"]).toBe(6);
  });

  it("preserves notes HTML (inline links)", () => {
    const result = parseComparisonTable(table);
    // Second row notes contain an anchor
    expect(result.rows[1].notes).toContain("<a");
    expect(result.rows[1].notes).toContain("Song_of_the_Elves");
  });

  it("parses numeric stats as numbers", () => {
    const result = parseComparisonTable(table);
    for (const row of result.rows) {
      expect(typeof row.stats["Ranged bonus"]).toBe("number");
    }
  });
});

describe("parseComparisonTable — no notes column", () => {
  it("handles table without a notes column", () => {
    const table = makeTable(STAT_TABLE_HTML);
    const result = parseComparisonTable(table);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0].notes).toBe("");
    expect(result.rows[0].name).toBe("Scythe of vitur");
    expect(result.rows[0].stats["Attack speed"]).toBe(5);
  });
});
