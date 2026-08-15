import { describe, expect, it } from "vitest";
import {
  applyInfoboxFromHtml,
  buildWikiLookupDocumentFromHtml,
  parseSections,
} from "./lookup";

describe("buildWikiLookupDocumentFromHtml", () => {
  it("keeps infobox HTML and hatnotes instead of flattening only", () => {
    const html = `
      <div class="mw-parser-output">
        <div class="hatnote">This article has a strategy guide.</div>
        <table class="infobox infobox-item">
          <tr><th colspan="2">Dragon scimitar</th></tr>
          <tr><td colspan="2"><img src="/images/Dragon_scimitar.png" alt="Dragon scimitar"></td></tr>
          <tr><th>Released</th><td>29 March 2005</td></tr>
          <tr><th>Members</th><td>Yes</td></tr>
        </table>
        <p>The dragon scimitar is the strongest scimitar available in Old School RuneScape.</p>
        <div class="mw-heading2"><h2>Combat stats</h2></div>
        <p>Attack bonuses live here.</p>
      </div>
    `;
    const doc = buildWikiLookupDocumentFromHtml(html, "Dragon scimitar", "item");
    expect(doc.hatnotes.length).toBe(1);
    expect(doc.hatnotes[0]).toContain("strategy guide");
    expect(doc.infoboxHtml).toBeTruthy();
    expect(doc.infoboxHtml).toContain("<table");
    expect(doc.infoboxHtml).toContain("Dragon scimitar");
    expect(doc.infoboxFields.some((f) => f.label === "Members")).toBe(true);
    expect(doc.sections.some((s) => s.title === "Combat stats")).toBe(true);
  });

  it("keeps only the visible version on a switch infobox", () => {
    const html = `
      <div class="mw-parser-output">
        <table class="infobox infobox-monster">
          <tr><th colspan="2">Zulrah</th></tr>
          <tr>
            <th>Combat level</th>
            <td>
              <span>725</span>
              <span style="display:none">725</span>
              <span style="display: none">725</span>
            </td>
          </tr>
          <tr class="advanced-data"><th>Item ID</th><td>123</td></tr>
          <tr><th>Location</th><td>Kourend<br>Tirannwn</td></tr>
        </table>
        <p>Zulrah is a snake boss with a long enough lead paragraph for the summary extractor.</p>
      </div>
    `;
    const doc = buildWikiLookupDocumentFromHtml(html, "Zulrah", "boss");
    const combat = doc.infoboxFields.find((f) => f.label === "Combat level");
    expect(combat?.value).toBe("725");
    expect(combat?.value).not.toContain("725725");
    expect(doc.infoboxFields.some((f) => f.label === "Item ID")).toBe(false);
    expect(doc.infoboxFields.find((f) => f.label === "Location")?.value).toBe(
      "Kourend, Tirannwn"
    );
  });
});

describe("parseSections", () => {
  it("splits H2 sections from a wiki parse dump", () => {
    const html = `
      <div class="mw-parser-output">
        <p>Lead.</p>
        <div class="mw-heading2"><h2>Requirements</h2></div>
        <p>Need Dragon Slayer II completed before you can fight this boss.</p>
        <div class="mw-heading2"><h2>References</h2></div>
        <p>Hidden end-matter should be ignored because it is references.</p>
      </div>
    `;
    const sections = parseSections(html);
    expect(sections.map((s) => s.title)).toEqual(["Requirements"]);
  });

  it("keeps posed paper-doll cells in combat stats", () => {
    const html = `
      <div class="mw-parser-output">
        <div class="mw-heading2"><h2>Combat stats</h2></div>
        <table class="infobox-bonuses">
          <tr>
            <th>Stab</th>
            <td>+67</td>
            <td class="infobox-bonuses-image" rowspan="2">
              <img src="/images/thumb/Dragon_scimitar_equipped_male.png/129px-Dragon_scimitar_equipped_male.png" alt="equipped">
            </td>
          </tr>
          <tr><th>Slash</th><td>+82</td></tr>
        </table>
        <p>Padding so the section is long enough to keep.</p>
      </div>
    `;
    const sections = parseSections(html);
    const combat = sections.find((s) => s.title === "Combat stats");
    expect(combat?.html).toContain("infobox-bonuses-image");
    expect(combat?.html).toContain("Dragon_scimitar_equipped_male");
  });
});

describe("applyInfoboxFromHtml", () => {
  it("copies the main-page infobox onto a strategies article", () => {
    const strategies = buildWikiLookupDocumentFromHtml(
      `<div class="mw-parser-output"><p>Strategy text that is long enough to extract as a summary for the guide.</p></div>`,
      "Vorkath/Strategies",
      "boss"
    );
    expect(strategies.infoboxHtml).toBeNull();
    const merged = applyInfoboxFromHtml(
      strategies,
      `
        <div class="mw-parser-output">
          <table class="infobox infobox-monster">
            <tr><th colspan="2">Vorkath</th></tr>
            <tr><th>Combat level</th><td>732</td></tr>
          </table>
          <p>Vorkath is a dragon.</p>
        </div>
      `,
      "Vorkath"
    );
    expect(merged.infoboxHtml).toContain("Vorkath");
    expect(merged.infoboxFields.some((f) => f.label === "Combat level")).toBe(true);
    expect(merged.title).toBe("Vorkath/Strategies");
  });
});
