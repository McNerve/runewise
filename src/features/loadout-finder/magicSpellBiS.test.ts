import { describe, it, expect } from "vitest";
import { resolveMagicSpell, poweredStaffSpell } from "./magicSpellBiS";

describe("poweredStaffSpell", () => {
  it("detects trident / sang / shadow", () => {
    expect(poweredStaffSpell("Trident of the seas")?.id).toBe("trident_seas");
    expect(poweredStaffSpell("Trident of the swamp")?.id).toBe("trident_swamp");
    expect(poweredStaffSpell("Sanguinesti staff")?.id).toBe("sanguinesti_staff");
    expect(poweredStaffSpell("Tumeken's shadow")?.id).toBe("tumekens_shadow");
    expect(poweredStaffSpell("Kodai wand")).toBeNull();
  });
});

describe("resolveMagicSpell", () => {
  it("uses powered staff scaling at 99", () => {
    const r = resolveMagicSpell({
      magicLevel: 99,
      weaponName: "Sanguinesti staff",
    });
    expect(r).not.toBeNull();
    expect(r!.poweredStaff).toBe(true);
    expect(r!.spellBaseMaxHit).toBe(Math.floor(99 / 3) - 1); // 32
  });

  it("picks highest unlocked autocast for kodai", () => {
    const r = resolveMagicSpell({
      magicLevel: 99,
      weaponName: "Kodai wand",
    });
    expect(r).not.toBeNull();
    expect(r!.poweredStaff).toBe(false);
    // Fire Surge is top standard autocast at 99
    expect(r!.spellBaseMaxHit).toBeGreaterThanOrEqual(24);
  });

  it("prefers fire spell slightly when tome equipped", () => {
    const r = resolveMagicSpell({
      magicLevel: 99,
      weaponName: "Kodai wand",
      preferFire: true,
    });
    expect(r?.spellElement).toBe("fire");
  });

  it("respects low magic level", () => {
    const r = resolveMagicSpell({
      magicLevel: 13,
      weaponName: "Staff of fire",
    });
    expect(r).not.toBeNull();
    expect(r!.spellBaseMaxHit).toBeLessThanOrEqual(8); // fire strike
  });
});
