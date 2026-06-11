import { describe, it, expect } from "vitest";
import { parseSections } from "../lookup";

function page(body: string): string {
  return `<div class="mw-parser-output">${body}</div>`;
}

const PARA = "<p>This paragraph easily clears the thirty character minimum for a section.</p>";

describe("parseSections", () => {
  it("splits the page on level-2 headings", () => {
    const html = page(`
      <p>Lead paragraph that belongs to the intro, not any section.</p>
      <div class="mw-heading2"><h2>Location</h2></div>
      ${PARA}
      <div class="mw-heading2"><h2>Strategy</h2></div>
      ${PARA}
    `);
    const sections = parseSections(html);
    expect(sections.map((s) => s.title)).toEqual(["Location", "Strategy"]);
    expect(sections[0].id).toBe("location");
    expect(sections[0].html).toContain("thirty character minimum");
  });

  it("handles bare h2 headings without mw-heading wrappers", () => {
    const html = page(`<h2>Drops</h2>${PARA}`);
    const sections = parseSections(html);
    expect(sections.map((s) => s.title)).toEqual(["Drops"]);
  });

  it("drops ignored sections like update history", () => {
    const html = page(`
      <div class="mw-heading2"><h2>Strategy</h2></div>
      ${PARA}
      <div class="mw-heading2"><h2>Update history</h2></div>
      ${PARA}
      <div class="mw-heading2"><h2>References</h2></div>
      ${PARA}
    `);
    expect(parseSections(html).map((s) => s.title)).toEqual(["Strategy"]);
  });

  it("drops sections with no real content", () => {
    const html = page(`
      <div class="mw-heading2"><h2>Empty</h2></div>
      <p>tiny</p>
      <div class="mw-heading2"><h2>Full</h2></div>
      ${PARA}
    `);
    expect(parseSections(html).map((s) => s.title)).toEqual(["Full"]);
  });

  it("demotes h3 subsections to anchored h4 and lists them", () => {
    const html = page(`
      <div class="mw-heading2"><h2>Strategy</h2></div>
      ${PARA}
      <div class="mw-heading3"><h3>Melee approach</h3></div>
      ${PARA}
      <div class="mw-heading3"><h3>Ranged approach</h3></div>
      ${PARA}
    `);
    const [section] = parseSections(html);
    expect(section.subsections).toEqual([
      { id: "strategy-melee-approach", title: "Melee approach" },
      { id: "strategy-ranged-approach", title: "Ranged approach" },
    ]);
    expect(section.html).toContain('id="strategy-melee-approach"');
    expect(section.html).toContain("<h4");
    expect(section.html).not.toContain("<h3");
  });

  it("strips edit links from section titles", () => {
    const html = page(`
      <div class="mw-heading2"><h2>Strategy</h2><span class="mw-editsection">[edit]</span></div>
      ${PARA}
    `);
    expect(parseSections(html)[0].title).toBe("Strategy");
  });
});

describe("hidden-variant and tabber handling", () => {
  it("drops display:none switch variants from section content", () => {
    const html = page(`
      <div class="mw-heading2"><h2>Forms</h2></div>
      <p>The serpentine form attacks with <span>ranged</span><span style="display:none">magic</span><span style="display: none">melee</span> and this padding makes it long enough.</p>
    `);
    const [section] = parseSections(html);
    expect(section.html).toContain("ranged");
    expect(section.html).not.toContain("magic");
    expect(section.html).not.toContain("melee");
  });

  it("converts tabbers into open/closed details panels", () => {
    const html = page(`
      <div class="mw-heading2"><h2>Strategy</h2></div>
      <div class="tabber">
        <div class="tabbertab" title="Melee"><p>Use a hasta with full obsidian armour for the bonus.</p></div>
        <div class="tabbertab" title="Ranged"><p>The blowpipe with dragon darts is the best choice here.</p></div>
      </div>
    `);
    const [section] = parseSections(html);
    expect(section.html).toContain("<details");
    expect(section.html).toContain("<summary>Melee</summary>");
    expect(section.html).toContain("<summary>Ranged</summary>");
    expect(section.html).toContain("blowpipe");
    expect(section.html).not.toContain("tabbertab");
    // Only the first panel starts open.
    expect(section.html.match(/<details[^>]*open/g)).toHaveLength(1);
  });
});
