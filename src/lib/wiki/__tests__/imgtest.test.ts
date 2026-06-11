import { describe, it, expect } from "vitest";
import { parseSections } from "../lookup";

describe("image survival", () => {
  it("keeps images in drop tables", () => {
    const html = `<div class="mw-parser-output">
      <div class="mw-heading2"><h2>Drops</h2></div>
      <table class="wikitable lighttable"><tr><th>Item</th></tr>
      <tr><td><img src="/images/Big_bones.png" width="24"> <a href="/w/Big_bones">Big bones</a> and some padding text here</td></tr></table>
    </div>`;
    const [section] = parseSections(html);
    console.log("SECTION HTML:", section.html);
    expect(section.html).toContain("<img");
  });
});
