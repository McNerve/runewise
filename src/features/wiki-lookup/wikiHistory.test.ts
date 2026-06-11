import { describe, it, expect } from "vitest";
import {
  EMPTY_HISTORY,
  visit,
  goBack,
  goForward,
  canGoBack,
  canGoForward,
  currentPage,
} from "./wikiHistory";

describe("wikiHistory", () => {
  it("starts empty with no navigation available", () => {
    expect(canGoBack(EMPTY_HISTORY)).toBe(false);
    expect(canGoForward(EMPTY_HISTORY)).toBe(false);
    expect(currentPage(EMPTY_HISTORY)).toBeNull();
  });

  it("records visits in order", () => {
    const h = visit(visit(visit(EMPTY_HISTORY, "A"), "B"), "C");
    expect(h.stack).toEqual(["A", "B", "C"]);
    expect(currentPage(h)).toBe("C");
    expect(canGoBack(h)).toBe(true);
    expect(canGoForward(h)).toBe(false);
  });

  it("dedupes consecutive visits to the same page", () => {
    const h = visit(visit(EMPTY_HISTORY, "A"), "A");
    expect(h.stack).toEqual(["A"]);
  });

  it("goes back and forward without losing the stack", () => {
    let h = visit(visit(visit(EMPTY_HISTORY, "A"), "B"), "C");
    h = goBack(h);
    expect(currentPage(h)).toBe("B");
    expect(canGoForward(h)).toBe(true);
    h = goBack(h);
    expect(currentPage(h)).toBe("A");
    expect(canGoBack(h)).toBe(false);
    h = goForward(h);
    expect(currentPage(h)).toBe("B");
  });

  it("truncates forward entries when branching", () => {
    let h = visit(visit(visit(EMPTY_HISTORY, "A"), "B"), "C");
    h = goBack(goBack(h));
    h = visit(h, "D");
    expect(h.stack).toEqual(["A", "D"]);
    expect(canGoForward(h)).toBe(false);
  });

  it("ignores back/forward at the edges", () => {
    const h = visit(EMPTY_HISTORY, "A");
    expect(goBack(h)).toBe(h);
    expect(goForward(h)).toBe(h);
  });
});
