import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AccountPrefillBanner from "../components/AccountPrefillBanner";

describe("AccountPrefillBanner", () => {
  it("renders nothing when hiscores are present", () => {
    const { container } = render(
      <AccountPrefillBanner hasHiscores context="combat levels" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("prompts for RSN when hiscores are missing", () => {
    render(<AccountPrefillBanner hasHiscores={false} context="combat levels" />);
    expect(screen.getByRole("note")).toHaveTextContent(/combat levels/i);
    expect(screen.getByRole("note")).toHaveTextContent(/RSN/i);
  });
});
