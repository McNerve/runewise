import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import { DeltaBadge } from "./DeltaBadge";

afterEach(cleanup);

describe("DeltaBadge", () => {
  it("renders a positive delta in the success tone with a + sign", () => {
    const { container } = render(<DeltaBadge delta={2.94} />);
    expect(screen.getByText("+2.94")).toBeInTheDocument();
    expect(container.firstElementChild?.className).toContain("text-success");
  });

  it("renders a negative delta in the danger tone", () => {
    const { container } = render(<DeltaBadge delta={-1.2} />);
    expect(screen.getByText("-1.20")).toBeInTheDocument();
    expect(container.firstElementChild?.className).toContain("text-danger");
  });

  it("renders zero in the neutral tone", () => {
    const { container } = render(<DeltaBadge delta={0} />);
    expect(container.firstElementChild?.className).toContain("text-text-secondary");
  });

  it("appends an optional percentage", () => {
    render(<DeltaBadge delta={2.94} pct={8.3} />);
    expect(screen.getByText("+8.3%")).toBeInTheDocument();
  });

  it("honours a custom number formatter", () => {
    render(<DeltaBadge delta={1234} format={(n) => `+${n.toLocaleString()}`} />);
    expect(screen.getByText("+1,234")).toBeInTheDocument();
  });
});
