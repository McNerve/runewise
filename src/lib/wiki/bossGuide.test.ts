import { describe, it, expect } from "vitest";
import { extractWeaknessFromInfobox } from "./bossGuide";

// ---------------------------------------------------------------------------
// extractWeaknessFromInfobox — Task 4 (infobox weakness)
// ---------------------------------------------------------------------------

describe("extractWeaknessFromInfobox", () => {
  it("extracts weakness from a standard wiki infobox", () => {
    const html = `
      <table class="infobox">
        <tbody>
          <tr><th>Name</th><td>Vorkath</td></tr>
          <tr><th>Combat level</th><td>732</td></tr>
          <tr><th>Weakness</th><td>Crumble Undead, Dragon hunter lance</td></tr>
          <tr><th>Hitpoints</th><td>750</td></tr>
        </tbody>
      </table>
    `;
    const result = extractWeaknessFromInfobox(html);
    expect(result).toBe("Crumble Undead, Dragon hunter lance");
  });

  it("extracts weakness from rsw-infobox class", () => {
    const html = `
      <div class="rsw-infobox">
        <table>
          <tr><th>Weakness</th><td>Stab</td></tr>
        </table>
      </div>
    `;
    const result = extractWeaknessFromInfobox(html);
    expect(result).toBe("Stab");
  });

  it("returns null when no infobox is present", () => {
    const html = `<div><p>Some content without an infobox</p></div>`;
    const result = extractWeaknessFromInfobox(html);
    expect(result).toBeNull();
  });

  it("returns null when infobox has no weakness row", () => {
    const html = `
      <table class="infobox">
        <tr><th>Name</th><td>Giant Mole</td></tr>
        <tr><th>Combat level</th><td>230</td></tr>
      </table>
    `;
    const result = extractWeaknessFromInfobox(html);
    expect(result).toBeNull();
  });

  it("handles 'Weak to' label variant", () => {
    const html = `
      <table class="infobox">
        <tr><th>Weak to</th><td>Slash</td></tr>
      </table>
    `;
    const result = extractWeaknessFromInfobox(html);
    expect(result).toBe("Slash");
  });

  it("normalises whitespace in the weakness value", () => {
    const html = `
      <table class="infobox">
        <tr><th>Weakness</th><td>  Magic  </td></tr>
      </table>
    `;
    const result = extractWeaknessFromInfobox(html);
    expect(result).toBe("Magic");
  });
});
