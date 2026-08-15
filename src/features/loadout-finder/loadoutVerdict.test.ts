import { describe, expect, it } from "vitest";
import { loadoutVerdict, styleGapLine } from "./loadoutVerdict";

const vorkathMelee = {
  name: "Optimized Melee",
  style: "melee" as const,
  dps: 6.49,
  ttk: 118,
  accuracy: 0.66,
  cost: 48_200_000,
};

describe("styleGapLine", () => {
  it("names other styles as percent behind", () => {
    const line = styleGapLine(vorkathMelee, [
      { name: "Max Ranged", style: "ranged", dps: 5.7 },
      { name: "Trident", style: "magic", dps: 3.8 },
    ]);
    expect(line).toMatch(/Ranged is 12% behind/);
    expect(line).toMatch(/Magic is 41% behind/);
  });

  it("falls back to the next same-style setup", () => {
    const line = styleGapLine(vorkathMelee, [
      { name: "Budget Melee", style: "melee", dps: 5.2 },
    ]);
    expect(line).toMatch(/Next melee setup is 20% behind/);
  });
});

describe("loadoutVerdict", () => {
  it("leads with wear + cost, then the kill sentence", () => {
    const line = loadoutVerdict({
      pick: vorkathMelee,
      others: [{ name: "Max Ranged", style: "ranged", dps: 5.7 }],
      targetName: "Vorkath",
    });
    expect(line.startsWith("Wear Optimized Melee for 48.2M.")).toBe(true);
    expect(line).toContain("Vorkath dies in 1m 58s at 6.49 DPS (66% accurate)");
    expect(line).toMatch(/Accuracy is the bottleneck/);
    expect(line).toMatch(/Ranged is 12% behind/);
  });

  it("flags a zero-dps pick", () => {
    expect(
      loadoutVerdict({
        pick: { ...vorkathMelee, dps: 0 },
        targetName: "Vorkath",
      })
    ).toMatch(/No damage/);
  });
});
