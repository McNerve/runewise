import { describe, it, expect } from "vitest";
import { compareTableCells, initSortableTables } from "../interactive";

describe("compareTableCells", () => {
  it("sorts plain numbers numerically", () => {
    expect(compareTableCells("9", "100")).toBeLessThan(0);
  });

  it("parses thousands separators and k/m/b suffixes", () => {
    expect(compareTableCells("1,500", "2k")).toBeLessThan(0);
    expect(compareTableCells("3m", "500k")).toBeGreaterThan(0);
    expect(compareTableCells("1b", "999m")).toBeGreaterThan(0);
  });

  it("sorts numbers before text and text alphabetically", () => {
    expect(compareTableCells("5", "Dragon")).toBeLessThan(0);
    expect(compareTableCells("Abyssal", "Dragon")).toBeLessThan(0);
  });
});

function buildTable(rows: string[][]): HTMLElement {
  const container = document.createElement("div");
  container.innerHTML = `<table>
    <thead><tr><th>Name</th><th>Price</th></tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>`;
  return container;
}

function columnValues(container: HTMLElement, col: number): string[] {
  return Array.from(container.querySelectorAll("tbody tr")).map(
    (row) => row.children[col]?.textContent ?? ""
  );
}

describe("initSortableTables", () => {
  it("sorts rows by clicked column, toggling direction", () => {
    const container = buildTable([
      ["Whip", "2.5m"],
      ["Scimitar", "30k"],
      ["Rapier", "40m"],
    ]);
    initSortableTables(container);
    const priceHeader = container.querySelectorAll("th")[1] as HTMLElement;

    priceHeader.click();
    expect(columnValues(container, 1)).toEqual(["30k", "2.5m", "40m"]);

    priceHeader.click();
    expect(columnValues(container, 1)).toEqual(["40m", "2.5m", "30k"]);
  });

  it("leaves tables with rowspans alone", () => {
    const container = document.createElement("div");
    container.innerHTML = `<table>
      <thead><tr><th>A</th><th>B</th></tr></thead>
      <tbody>
        <tr><td rowspan="2">x</td><td>2</td></tr>
        <tr><td>1</td></tr>
        <tr><td>y</td><td>3</td></tr>
      </tbody>
    </table>`;
    initSortableTables(container);
    expect(container.querySelector("th")?.dataset.sortInit).toBeUndefined();
  });

  it("skips tiny tables", () => {
    const container = buildTable([["Whip", "1"]]);
    initSortableTables(container);
    expect(container.querySelector("th")?.dataset.sortInit).toBeUndefined();
  });
});
