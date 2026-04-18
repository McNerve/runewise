import { describe, expect, it, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import { NavigationProvider } from "../lib/NavigationContext";
import { SettingsContext } from "../hooks/useSettings";
import { DEFAULT_SETTINGS } from "../lib/settings";
import Overview from "../features/overview/Overview";
import type { HiscoreData } from "../lib/api/hiscores";

vi.mock("../lib/api/wom", () => ({
  fetchWomPlayer: vi.fn().mockResolvedValue(null),
}));

function wrap(node: ReactNode) {
  return (
    <SettingsContext.Provider
      value={{ settings: DEFAULT_SETTINGS, update: () => {}, resetAll: () => {} }}
    >
      <NavigationProvider>{node}</NavigationProvider>
    </SettingsContext.Provider>
  );
}

function makeHiscores(bossActivities: { name: string; score: number; id: number }[]): HiscoreData {
  return {
    skills: [
      { id: 0, rank: 1, level: 50, xp: 100_000, name: "Overall" },
      { id: 1, rank: 1, level: 1, xp: 0, name: "Attack" },
      { id: 2, rank: 1, level: 1, xp: 0, name: "Defence" },
      { id: 3, rank: 1, level: 1, xp: 0, name: "Strength" },
      { id: 4, rank: 1, level: 10, xp: 1_000, name: "Hitpoints" },
      { id: 5, rank: 1, level: 1, xp: 0, name: "Ranged" },
      { id: 6, rank: 1, level: 1, xp: 0, name: "Prayer" },
      { id: 7, rank: 1, level: 1, xp: 0, name: "Magic" },
    ],
    activities: bossActivities.map((a) => ({ ...a, rank: 1 })),
  };
}

describe("profile boss KC weakness chip", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows weakness chip for a boss with known weakness", () => {
    const hiscores = makeHiscores([
      { name: "Vorkath", score: 500, id: 30 },
    ]);
    const { container } = render(wrap(<Overview hiscores={hiscores} rsn="testplayer" />));
    // The weakness chip has a specific amber pill class
    const chips = container.querySelectorAll(".bg-amber-500\\/15");
    expect(chips.length).toBeGreaterThan(0);
    expect(chips[0].textContent).toBe("Ranged");
  });

  it("shows weakness chip for Dagannoth Rex (Magic)", () => {
    const hiscores = makeHiscores([
      { name: "Dagannoth Rex", score: 200, id: 31 },
    ]);
    const { container } = render(wrap(<Overview hiscores={hiscores} rsn="testplayer" />));
    const chips = container.querySelectorAll(".bg-amber-500\\/15");
    expect(chips.length).toBeGreaterThan(0);
    expect(chips[0].textContent).toBe("Magic");
  });

  it("shows no weakness chip for a boss without weakness data", () => {
    const hiscores = makeHiscores([
      { name: "Barrows Chests", score: 100, id: 40 },
    ]);
    const { container } = render(wrap(<Overview hiscores={hiscores} rsn="testplayer" />));
    const chips = container.querySelectorAll(".bg-amber-500\\/15");
    expect(chips.length).toBe(0);
  });

  it("shows weakness chip for General Graardor (Melee)", () => {
    const hiscores = makeHiscores([
      { name: "General Graardor", score: 350, id: 21 },
    ]);
    const { container } = render(wrap(<Overview hiscores={hiscores} rsn="testplayer" />));
    const chips = container.querySelectorAll(".bg-amber-500\\/15");
    expect(chips.length).toBeGreaterThan(0);
    expect(chips[0].textContent).toBe("Melee");
  });

  it("renders boss name and kill count alongside weakness chip", () => {
    const hiscores = makeHiscores([
      { name: "Zulrah", score: 1234, id: 22 },
    ]);
    const { container, getAllByText } = render(wrap(<Overview hiscores={hiscores} rsn="testplayer" />));
    expect(getAllByText("Zulrah").length).toBeGreaterThan(0);
    const chips = container.querySelectorAll(".bg-amber-500\\/15");
    expect(chips.length).toBeGreaterThan(0);
    expect(chips[0].textContent).toBe("Magic/Ranged");
  });
});
