import { describe, expect, it } from "vitest";
import { normalizeImages } from "./helpers";

function makeRoot(html: string): Element {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div;
}

describe("normalizeImages", () => {
  it("prefixes root-relative src with wiki domain", () => {
    const root = makeRoot(`<img src="/images/Twisted_bow.png?abc">`);
    normalizeImages(root);
    const img = root.querySelector("img")!;
    expect(img.getAttribute("src")).toBe("https://oldschool.runescape.wiki/images/Twisted_bow.png?abc");
  });

  it("prefixes protocol-relative src with https", () => {
    const root = makeRoot(`<img src="//oldschool.runescape.wiki/images/item.png">`);
    normalizeImages(root);
    expect(root.querySelector("img")!.getAttribute("src")).toBe("https://oldschool.runescape.wiki/images/item.png");
  });

  it("copies data-src to src when src is absent (lazy-load pattern)", () => {
    const root = makeRoot(`<img src="" data-src="/images/lazy.png">`);
    normalizeImages(root);
    const img = root.querySelector("img")!;
    expect(img.getAttribute("src")).toBe("https://oldschool.runescape.wiki/images/lazy.png");
    expect(img.getAttribute("data-src")).toBeNull();
  });

  it("uses first srcset candidate when src is empty", () => {
    const root = makeRoot(`<img src="" srcset="/images/item.png 1x, /images/item@2x.png 2x">`);
    normalizeImages(root);
    const img = root.querySelector("img")!;
    expect(img.getAttribute("src")).toBe("https://oldschool.runescape.wiki/images/item.png");
  });

  it("uses srcset first candidate (with descriptor) when src missing", () => {
    const root = makeRoot(`<img srcset="//oldschool.runescape.wiki/images/item.png 1.5x">`);
    normalizeImages(root);
    const img = root.querySelector("img")!;
    expect(img.getAttribute("src")).toBe("https://oldschool.runescape.wiki/images/item.png");
  });

  it("removes srcset attribute after processing", () => {
    const root = makeRoot(`<img src="/images/item.png" srcset="/images/item.png 1x">`);
    normalizeImages(root);
    expect(root.querySelector("img")!.getAttribute("srcset")).toBeNull();
  });

  it("removes data-file-width and data-file-height", () => {
    const root = makeRoot(`<img src="/images/item.png" data-file-width="50" data-file-height="60">`);
    normalizeImages(root);
    const img = root.querySelector("img")!;
    expect(img.getAttribute("data-file-width")).toBeNull();
    expect(img.getAttribute("data-file-height")).toBeNull();
  });

  it("sets loading=lazy on all images", () => {
    const root = makeRoot(`<img src="/images/item.png">`);
    normalizeImages(root);
    expect(root.querySelector("img")!.getAttribute("loading")).toBe("lazy");
  });

  it("does not modify already-absolute https src", () => {
    const root = makeRoot(`<img src="https://oldschool.runescape.wiki/images/item.png">`);
    normalizeImages(root);
    expect(root.querySelector("img")!.getAttribute("src")).toBe("https://oldschool.runescape.wiki/images/item.png");
  });

  it("handles multiple images in the same container", () => {
    const root = makeRoot(`
      <img src="/images/first.png">
      <img src="" srcset="/images/second.png 1x">
      <img src="" data-src="/images/third.png">
    `);
    normalizeImages(root);
    const imgs = root.querySelectorAll("img");
    expect(imgs[0].getAttribute("src")).toBe("https://oldschool.runescape.wiki/images/first.png");
    expect(imgs[1].getAttribute("src")).toBe("https://oldschool.runescape.wiki/images/second.png");
    expect(imgs[2].getAttribute("src")).toBe("https://oldschool.runescape.wiki/images/third.png");
  });
});
