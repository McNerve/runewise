import { describe, it, expect } from "vitest";
import { resolveGoBackAction, resolveCanGoBack } from "./navigationBack";

describe("resolveGoBackAction", () => {
  it("uses history.back when in-app depth > 0", () => {
    expect(resolveGoBackAction(1, "market", {})).toBe("history-back");
    expect(resolveGoBackAction(3, "home", {})).toBe("history-back");
  });

  it("falls back to home on first-entry deep link (depth 0, non-home)", () => {
    expect(resolveGoBackAction(0, "market", {})).toBe("navigate-home");
    expect(resolveGoBackAction(0, "bosses", { boss: "Zulrah" })).toBe("navigate-home");
  });

  it("is a noop on bare home with no depth", () => {
    expect(resolveGoBackAction(0, "home", {})).toBe("noop");
  });

  it("falls back to home when home has params but no depth", () => {
    expect(resolveGoBackAction(0, "home", { tab: "x" })).toBe("navigate-home");
  });
});

describe("resolveCanGoBack", () => {
  it("is true with depth even on home", () => {
    expect(resolveCanGoBack(1, "home", {})).toBe(true);
  });

  it("is true on non-home without depth (deep link)", () => {
    expect(resolveCanGoBack(0, "market", {})).toBe(true);
  });

  it("is false on bare home without depth", () => {
    expect(resolveCanGoBack(0, "home", {})).toBe(false);
  });
});
