import { describe, expect, it, vi } from "vitest";
import { itemWikiHash, openItemPage } from "./openItem";

describe("openItemPage", () => {
  it("routes to the wiki article, not the market row", () => {
    const navigate = vi.fn();
    openItemPage(navigate, "Dragon scimitar");
    expect(navigate).toHaveBeenCalledWith("wiki", {
      page: "Dragon scimitar",
      query: "Dragon scimitar",
    });
  });

  it("builds an in-app wiki hash", () => {
    expect(itemWikiHash("Twisted bow")).toBe(
      "#wiki?page=Twisted+bow&query=Twisted+bow"
    );
  });
});
