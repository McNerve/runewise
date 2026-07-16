import { describe, it, expect, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import OfflineBanner from "../components/OfflineBanner";

describe("OfflineBanner", () => {
  afterEach(() => {
    cleanup();
    // Reset connectivity for the next case.
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      get: () => true,
    });
  });

  it("is hidden while online", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      get: () => true,
    });
    render(<OfflineBanner />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows on offline and clears on online", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      get: () => true,
    });
    const { container } = render(<OfflineBanner />);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    const status = container.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    expect(status).toHaveTextContent(/offline/i);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it("renders immediately when the page loads offline", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      get: () => false,
    });
    const { container } = render(<OfflineBanner />);
    expect(container.querySelector('[role="status"]')).toHaveTextContent(/offline/i);
  });
});
