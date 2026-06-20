import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import { Card } from "./Card";

afterEach(cleanup);

describe("Card", () => {
  it("renders children", () => {
    render(<Card>hello</Card>);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("renders a kicker header and right-aligned action", () => {
    render(
      <Card kicker="Results" action={<button>act</button>}>
        body
      </Card>
    );
    expect(screen.getByText("Results")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "act" })).toBeInTheDocument();
  });

  it("omits the header row when no kicker or action", () => {
    const { container } = render(<Card>just body</Card>);
    expect(container.querySelector(".section-kicker")).toBeNull();
  });

  it("maps each elevation to a distinct surface class", () => {
    const variants = {
      flat: "bg-bg-base",
      raised: "bg-bg-tertiary",
      overlay: "bg-bg-overlay",
      hero: "border-accent-deep",
    } as const;
    for (const [elevation, cls] of Object.entries(variants)) {
      const { container } = render(
        <Card elevation={elevation as keyof typeof variants}>x</Card>
      );
      expect(container.firstElementChild?.className).toContain(cls);
      cleanup();
    }
  });

  it("forwards className alongside the surface classes", () => {
    const { container } = render(<Card className="custom-x">y</Card>);
    const el = container.firstElementChild!;
    expect(el.className).toContain("custom-x");
    expect(el.className).toContain("bg-bg-tertiary");
  });
});
