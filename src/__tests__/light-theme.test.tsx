import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import { NavigationProvider } from "../lib/NavigationContext";
import { SettingsContext } from "../hooks/useSettings";
import { DEFAULT_SETTINGS } from "../lib/settings";
import Home from "../features/home/Home";
import Overview from "../features/overview/Overview";
import Market from "../features/market/Market";
import Settings from "../features/settings/Settings";
import type { HiscoreData } from "../lib/api/hiscores";

// Prevent network calls during render — return empty data.
vi.mock("../lib/api/ge", async () => {
  const actual = await vi.importActual<typeof import("../lib/api/ge")>(
    "../lib/api/ge"
  );
  return {
    ...actual,
    fetchLatestPrices: vi.fn().mockResolvedValue({}),
    fetchMapping: vi.fn().mockResolvedValue([]),
    searchItems: vi.fn().mockResolvedValue([]),
    fetchVolumes: vi.fn().mockResolvedValue({}),
  };
});

vi.mock("../lib/api/ge-timeseries", () => ({
  fetchTimeseries: vi.fn().mockResolvedValue([]),
}));

vi.mock("../lib/api/wom", () => ({
  fetchWomPlayer: vi.fn().mockResolvedValue(null),
}));

vi.mock("../hooks/useGEData", () => {
  const state = {
    mapping: [],
    prices: {},
    loading: false,
    error: null,
    fetchIfNeeded: vi.fn().mockResolvedValue(undefined),
  };
  return {
    useGEData: () => state,
    GEDataProvider: ({ children }: { children: ReactNode }) => children,
    useGEDataProvider: () => state,
  };
});

function wrap(node: ReactNode) {
  return (
    <SettingsContext.Provider
      value={{
        settings: DEFAULT_SETTINGS,
        update: () => {},
        resetAll: () => {},
      }}
    >
      <NavigationProvider>{node}</NavigationProvider>
    </SettingsContext.Provider>
  );
}

const BLANK_HISCORES: HiscoreData = {
  skills: [
    { id: 0, rank: 1, level: 50, xp: 100_000, name: "Overall" },
    { id: 1, rank: 1, level: 1, xp: 0, name: "Attack" },
    { id: 2, rank: 1, level: 1, xp: 0, name: "Defence" },
    { id: 3, rank: 1, level: 1, xp: 0, name: "Strength" },
    { id: 4, rank: 1, level: 10, xp: 1000, name: "Hitpoints" },
    { id: 5, rank: 1, level: 1, xp: 0, name: "Ranged" },
    { id: 6, rank: 1, level: 1, xp: 0, name: "Prayer" },
    { id: 7, rank: 1, level: 1, xp: 0, name: "Magic" },
  ],
  activities: [],
};

describe("light theme", () => {
  beforeEach(() => {
    document.documentElement.classList.add("light-theme");
    // Inline the token definitions so jsdom can resolve them via getComputedStyle.
    const style = document.createElement("style");
    style.id = "test-light-tokens";
    style.textContent = `
      .light-theme {
        --color-bg-primary: #eceef2;
        --color-bg-secondary: #ffffff;
        --color-bg-tertiary: #dfe3ea;
        --color-text-primary: #11131a;
        --color-text-secondary: #424754;
        --color-accent: #2563eb;
        --color-accent-hover: #1d4ed8;
        --color-border: #bcc4d1;
      }
    `;
    document.head.appendChild(style);
  });

  afterEach(() => {
    document.documentElement.classList.remove("light-theme");
    document.getElementById("test-light-tokens")?.remove();
    cleanup();
  });

  it("resolves light-mode CSS custom properties on the root element", () => {
    const styles = getComputedStyle(document.documentElement);
    expect(styles.getPropertyValue("--color-bg-secondary").trim()).toBe(
      "#ffffff"
    );
    expect(styles.getPropertyValue("--color-bg-tertiary").trim()).toBe(
      "#dfe3ea"
    );
    expect(styles.getPropertyValue("--color-accent").trim()).toBe("#2563eb");
    expect(styles.getPropertyValue("--color-text-primary").trim()).toBe(
      "#11131a"
    );
  });

  it("renders Home without crashing", () => {
    const { container } = render(wrap(<Home />));
    expect(container.querySelector("h2")).toBeTruthy();
  });

  it("renders Overview without crashing", () => {
    const { container } = render(
      wrap(<Overview hiscores={BLANK_HISCORES} rsn="testplayer" />)
    );
    expect(container.textContent).toBeTruthy();
  });

  it("renders Market without crashing", () => {
    const { container } = render(wrap(<Market />));
    expect(container.textContent).toBeTruthy();
  });

  it("renders Settings without crashing", () => {
    const { container } = render(wrap(<Settings />));
    expect(container.textContent).toBeTruthy();
  });
});
