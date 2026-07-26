import { describe, it, expect } from "vitest";
import { parseOwnedInventory, normalizeOwnedToken } from "./parseOwnedInventory";

describe("normalizeOwnedToken", () => {
  it("strips qty prefixes and suffixes", () => {
    expect(normalizeOwnedToken("3 x Abyssal whip")).toBe("Abyssal whip");
    expect(normalizeOwnedToken("Abyssal whip x 3")).toBe("Abyssal whip");
    expect(normalizeOwnedToken("Fire cape, 1")).toBe("Fire cape");
  });

  it("rejects headers and pure numbers", () => {
    expect(normalizeOwnedToken("name")).toBeNull();
    expect(normalizeOwnedToken("42")).toBeNull();
    expect(normalizeOwnedToken("")).toBeNull();
  });
});

describe("parseOwnedInventory", () => {
  it("parses line-based bank dump", () => {
    const text = `
Fire cape
3 x Abyssal whip
Fighter torso
`;
    expect(parseOwnedInventory(text)).toEqual([
      "Fire cape",
      "Abyssal whip",
      "Fighter torso",
    ]);
  });

  it("parses CSV first column", () => {
    const text = `name,quantity
Abyssal whip,1
Dragon scimitar,2`;
    expect(parseOwnedInventory(text)).toEqual(["Abyssal whip", "Dragon scimitar"]);
  });

  it("parses comma list on one line", () => {
    expect(parseOwnedInventory("Fire cape, Barrows gloves, Dragon defender")).toEqual([
      "Fire cape",
      "Barrows gloves",
      "Dragon defender",
    ]);
  });

  it("dedupes case-insensitively", () => {
    expect(parseOwnedInventory("Whip\nwhip\nWHIP")).toEqual(["Whip"]);
  });
});
