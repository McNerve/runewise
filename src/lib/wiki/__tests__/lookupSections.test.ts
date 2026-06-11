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
