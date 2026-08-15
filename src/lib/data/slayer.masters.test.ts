import { describe, expect, it } from "vitest";
import { SLAYER_MASTERS } from "./slayer";

describe("SLAYER_MASTERS", () => {
  it("includes Mortimer with the wiki task pool", () => {
    const mortimer = SLAYER_MASTERS.find((m) => m.name === "Mortimer");
    expect(mortimer).toBeDefined();
    expect(mortimer?.location).toBe("Wyrmscraig Cavern");
    expect(mortimer?.combatRequired).toBe(100);
    expect(mortimer?.slayerRequired).toBe(70);
    expect(mortimer?.tasks.length).toBe(29);
    expect(mortimer?.tasks.some((t) => t.monster === "Venators" && t.slayerLevel === 74)).toBe(
      true
    );
    expect(mortimer?.tasks.some((t) => t.monster === "Hydras" && t.weight === 10)).toBe(true);
    const basilisks = mortimer?.tasks.find((t) => t.monster === "Basilisks");
    expect(basilisks?.requiredUnlock).toBe("Basilocked");
  });
});
