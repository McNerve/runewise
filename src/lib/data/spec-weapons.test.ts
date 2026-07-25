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

  it("burning claws uses cascade and 35% energy", () => {
    const bc = spec("burning_claws");
    expect(bc.cascadeType).toBe("burning_claws");
    expect(bc.specCost).toBe(35);
    expect(bc.hits).toBe(3);
  });

  it("ballistas use +25% acc/dmg at 65% energy", () => {
    for (const id of ["heavy_ballista", "light_ballista"] as const) {
      const b = spec(id);
      expect(b.accuracyMult).toBe(1.25);
      expect(b.damageMult).toBe(1.25);
      expect(b.specCost).toBe(65);
    }
  });

  it("MSB and MSB(i) are two-hit specs", () => {
    expect(spec("magic_shortbow").hits).toBe(2);
    expect(spec("magic_shortbow").specCost).toBe(55);
    expect(spec("magic_shortbow_i").hits).toBe(2);
    expect(spec("magic_shortbow_i").specCost).toBe(50);
  });
});
