/**
 * Tests for wikitable class → renderer classification.
 *
 * Classes that trigger which renderer:
 *  - `.wikitable` with numeric columns + 3+ cols  → ComparisonTable (isComparisonTable=true)
 *  - `.wikitable` with < 2 numeric cols           → HTML fallback
 *  - `.infobox`, `.infobox-bonuses`               → hidden / sidebar snapshot
 *  - `.equipment`, `.inventorytable`, `.runepouchtable`, `.lootingbagtable` → custom CSS
 */
import { describe, it, expect } from "vitest";
import { isComparisonTable } from "../tables";

function makeTable(html: string): HTMLTableElement {
  const div = document.createElement("div");
  div.innerHTML = html.trim();
  return div.querySelector("table") as HTMLTableElement;
}

describe("table classification", () => {
  it("wikitable with numeric cols → comparison", () => {
    const html = `
      <table class="wikitable">
        <tr><th>Item</th><th>Attack</th><th>Strength</th><th>Notes</th></tr>
        <tr><td>Dragon scimitar</td><td>67</td><td>66</td><td>Common bis for low levels.</td></tr>
        <tr><td>Abyssal whip</td><td>82</td><td>82</td><td>Slash training staple.</td></tr>
        <tr><td>Blade of saeldor</td><td>92</td><td>88</td><td>BiS slash weapon.</td></tr>
      </table>`;
    expect(isComparisonTable(makeTable(html))).toBe(true);
  });

  it("wikitable with only text columns → not a comparison table", () => {
    const html = `
      <table class="wikitable">
        <tr><th>Item</th><th>Rarity</th></tr>
        <tr><td>Dragon bones</td><td>Always</td></tr>
        <tr><td>Rune platelegs</td><td>Rare</td></tr>
      </table>`;
    expect(isComparisonTable(makeTable(html))).toBe(false);
  });

  it("equipment table is not a comparison table", () => {
    const html = `
      <table class="wikitable equipment">
        <tr><th>Slot</th><th>Item</th></tr>
        <tr><td>Head</td><td>Void knight helm</td></tr>
        <tr><td>Body</td><td>Void knight top</td></tr>
      </table>`;
    expect(isComparisonTable(makeTable(html))).toBe(false);
  });

  it("table with fewer than 3 columns is not a comparison table", () => {
    const html = `
      <table class="wikitable">
        <tr><th>Ingredient</th><th>Amount</th></tr>
        <tr><td>Vial of water</td><td>1</td></tr>
        <tr><td>Guam leaf</td><td>1</td></tr>
      </table>`;
    expect(isComparisonTable(makeTable(html))).toBe(false);
  });

  it("table with fewer than 2 rows is not a comparison table", () => {
    const html = `
      <table class="wikitable">
        <tr><th>Item</th><th>Attack</th><th>Strength</th></tr>
        <tr><td>Dragon scimitar</td><td>67</td><td>66</td></tr>
      </table>`;
    expect(isComparisonTable(makeTable(html))).toBe(false);
  });

  it("comparison table with sticky-header class still classified correctly", () => {
    const html = `
      <table class="wikitable sticky-header">
        <tr><th>Weapon</th><th>DPS</th><th>Max hit</th><th>Notes</th></tr>
        <tr><td>Twisted bow</td><td>8.5</td><td>54</td><td>Scales with magic level.</td></tr>
        <tr><td>Zaryte crossbow</td><td>7.2</td><td>52</td><td>Uses diamond bolts.</td></tr>
        <tr><td>Blowpipe</td><td>6.8</td><td>30</td><td>Very fast attack speed.</td></tr>
      </table>`;
    expect(isComparisonTable(makeTable(html))).toBe(true);
  });
});
