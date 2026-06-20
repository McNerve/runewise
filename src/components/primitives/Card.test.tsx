import { describe, expect, it, afterEach, vi } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import Card from "./Card";

afterEach(cleanup);

describe("Card", () => {
  it("renders children", () => {
    render(<Card>hello</Card>);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("renders a static div by default (no button role)", () => {
    render(<Card>plain</Card>);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders a real button and fires onClick when interactive", () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>clickable</Card>);
    const btn = screen.getByRole("button", { name: "clickable" });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
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
