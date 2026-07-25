import { describe, it, expect } from "vitest";
import { SPEC_WEAPONS } from "./spec-weapons";

function spec(id: string) {
  const w = SPEC_WEAPONS.find((s) => s.id === id);
  if (!w) throw new Error(`spec weapon ${id} not found`);
  return w;
}

// These pin the wiki-cited OSRS special-attack damage multipliers. The generic
// spec model computes spec max hit as floor(baseMaxHit * damageMult), so each
// value below is the true in-game damage bonus.
describe("spec weapon damage multipliers", () => {
  it("Bandos godsword Warstrike is +21% damage", () => {
    expect(spec("bandos_godsword").damageMult).toBe(1.21);
  });

  it("Saradomin godsword is +10% damage", () => {
    expect(spec("saradomin_godsword").damageMult).toBe(1.1);
  });

  it("Ancient godsword Blood Sacrifice is +10% damage", () => {
    expect(spec("ancient_godsword").damageMult).toBe(1.1);
  });

  it("Armadyl godsword stays +37.5%", () => {
    expect(spec("armadyl_godsword").damageMult).toBe(1.375);
  });

  it("Dragon warhammer Smash is +50% damage", () => {
    expect(spec("dragon_warhammer").damageMult).toBe(1.5);
  });

  it("Voidwaker uses dedicated cascade (50–150% band), guaranteed hit", () => {
    const vw = spec("voidwaker");
    expect(vw.cascadeType).toBe("voidwaker");
    expect(vw.guaranteedHit).toBe(true);
    expect(vw.damageMult).toBe(1.0);
  });

  it("dark bow and fang specs use dedicated cascades", () => {
    expect(spec("dark_bow").cascadeType).toBe("dark_bow");
    expect(spec("osmumtens_fang").cascadeType).toBe("fang_spec");
    expect(spec("webweaver_bow").cascadeType).toBe("webweaver");
  });
});
