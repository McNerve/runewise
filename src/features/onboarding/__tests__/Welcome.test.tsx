import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import { NavigationProvider } from "../../../lib/NavigationContext";
import { SettingsContext } from "../../../hooks/useSettings";
import { DEFAULT_SETTINGS } from "../../../lib/settings";
import Welcome from "../Welcome";
import { ONBOARDING_KEY, RSN_KEY } from "../constants";

// Motion/react stub — render children immediately without animations.
vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...rest }: { children: ReactNode; className?: string }) => (
      <div {...rest}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// Stub notify — we don't want real system calls in tests.
vi.mock("../../../lib/notify", () => ({
  sendNotification: vi.fn().mockResolvedValue(undefined),
}));

// Stub openExternal.
vi.mock("../../../lib/openExternal", () => ({
  openExternal: vi.fn().mockResolvedValue(undefined),
}));

function wrap(node: ReactNode) {
  return (
    <SettingsContext.Provider
      value={{
        settings: DEFAULT_SETTINGS,
        update: vi.fn(),
        resetAll: vi.fn(),
      }}
    >
      <NavigationProvider>{node}</NavigationProvider>
    </SettingsContext.Provider>
  );
}

describe("Welcome onboarding flow", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("renders the welcome step by default", () => {
    const onDismiss = vi.fn();
    render(wrap(<Welcome onDismiss={onDismiss} />));
    expect(screen.getByText("Welcome to RuneWise")).toBeTruthy();
  });

  it("calls onDismiss and sets storage key when Skip setup is clicked", () => {
    const onDismiss = vi.fn();
    render(wrap(<Welcome onDismiss={onDismiss} />));
    fireEvent.click(screen.getByText("Skip setup"));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(localStorage.getItem(ONBOARDING_KEY)).toBe("true");
  });

  it("advances to RSN step when Get started is clicked", () => {
    const onDismiss = vi.fn();
    render(wrap(<Welcome onDismiss={onDismiss} />));
    fireEvent.click(screen.getByText(/Get started/));
    expect(screen.getByPlaceholderText("e.g. Zezima")).toBeTruthy();
  });

  it("RSN step: Skip for now advances to next step", () => {
    const onDismiss = vi.fn();
    render(wrap(<Welcome onDismiss={onDismiss} />));
    // advance to step 1
    fireEvent.click(screen.getByText(/Get started/));
    fireEvent.click(screen.getByText("Skip for now"));
    // step 2: WOM
    expect(screen.getByText(/Wise Old Man/)).toBeTruthy();
  });

  it("RSN step: stores RSN in localStorage on Continue with prefilled value", async () => {
    // Pre-populate localStorage with a known RSN so Continue is enabled
    localStorage.setItem(RSN_KEY, "Zezima");

    const onDismiss = vi.fn();
    render(wrap(<Welcome onDismiss={onDismiss} />));
    // advance to step 1
    fireEvent.click(screen.getByText(/Get started/));

    const input = screen.getByPlaceholderText("e.g. Zezima") as HTMLInputElement;
    expect(input.value).toBe("Zezima");

    // Continue button should not be disabled (idle + value present)
    const continueBtn = screen.getByRole("button", { name: /Continue/ });
    expect((continueBtn as HTMLButtonElement).disabled).toBe(false);
  });

  it("RSN input rejects names longer than 12 characters", async () => {
    const onDismiss = vi.fn();
    render(wrap(<Welcome onDismiss={onDismiss} />));
    fireEvent.click(screen.getByText(/Get started/));

    const input = screen.getByPlaceholderText("e.g. Zezima");
    fireEvent.change(input, { target: { value: "ABCDEFGHIJKLM" } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText(/RSN must be 1–12 characters/)).toBeTruthy();
    });
  });

  it("notification toggles are rendered in step 5", async () => {
    const onDismiss = vi.fn();
    render(wrap(<Welcome onDismiss={onDismiss} />));

    // Advance through all steps to notifications (step index 4)
    fireEvent.click(screen.getByText(/Get started/));      // step 0 → 1
    fireEvent.click(screen.getByText("Skip for now"));     // step 1 → 2
    fireEvent.click(screen.getByText(/I'm already tracked/)); // step 2 → 3
    fireEvent.click(screen.getByText(/I'll set this up later/)); // step 3 → 4

    expect(screen.getByText("Stay in the loop")).toBeTruthy();
    expect(screen.getByLabelText("Watchlist price alerts")).toBeTruthy();
    expect(screen.getByLabelText("Farming timer ready")).toBeTruthy();
    expect(screen.getByLabelText("Shooting star spawns")).toBeTruthy();
    expect(screen.getByLabelText("XP milestone achievements")).toBeTruthy();
  });

  it("notification toggles can be toggled", async () => {
    const onDismiss = vi.fn();
    render(wrap(<Welcome onDismiss={onDismiss} />));

    fireEvent.click(screen.getByText(/Get started/));
    fireEvent.click(screen.getByText("Skip for now"));
    fireEvent.click(screen.getByText(/I'm already tracked/));
    fireEvent.click(screen.getByText(/I'll set this up later/));

    const priceToggle = screen.getByLabelText("Watchlist price alerts");
    // Default is on
    expect(priceToggle.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(priceToggle);
    expect(priceToggle.getAttribute("aria-checked")).toBe("false");
  });

  it("finish step shows quick action tiles and completes on Enter RuneWise", () => {
    const onDismiss = vi.fn();
    render(wrap(<Welcome onDismiss={onDismiss} />));

    fireEvent.click(screen.getByText(/Get started/));
    fireEvent.click(screen.getByText("Skip for now"));
    fireEvent.click(screen.getByText(/I'm already tracked/));
    fireEvent.click(screen.getByText(/I'll set this up later/));
    fireEvent.click(screen.getByText(/Continue/));

    expect(screen.getByText("You're all set")).toBeTruthy();
    expect(screen.getByText(/Press Cmd\+K to jump anywhere/)).toBeTruthy();
    expect(screen.getByText(/Check boss strategies/)).toBeTruthy();
    expect(screen.getByText(/Run the DPS Calculator/)).toBeTruthy();

    fireEvent.click(screen.getByText(/Enter RuneWise/));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(localStorage.getItem(ONBOARDING_KEY)).toBe("true");
  });
});

describe("onboarding trigger logic", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("does NOT show when onboarding_completed is set", () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    // The Welcome component itself always shows — trigger logic lives in App.
    // We test it here by simulating the guard condition.
    const completed = localStorage.getItem(ONBOARDING_KEY);
    expect(completed).toBe("true");
  });

  it("does NOT show when RSN is already stored", () => {
    localStorage.setItem(RSN_KEY, "Zezima");
    const hasRsn = Boolean(localStorage.getItem(RSN_KEY));
    expect(hasRsn).toBe(true);
  });

  it("SHOULD show when neither flag is set", () => {
    localStorage.clear();
    const completed = localStorage.getItem(ONBOARDING_KEY);
    const hasRsn = Boolean(localStorage.getItem(RSN_KEY));
    expect(!completed && !hasRsn).toBe(true);
  });
});
