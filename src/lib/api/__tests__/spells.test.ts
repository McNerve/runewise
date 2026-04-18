import { describe, it, expect } from "vitest";
import { toWikiSpell, type RawBucketSpell } from "../spells";

function makeRaw(overrides: Partial<RawBucketSpell> = {}): RawBucketSpell {
  return {
    page_name: "Wind Strike",
    image: null as unknown as string,
    is_members_only: "No",
    spellbook: "Standard spellbook",
    uses_material: "1 Air rune; 1 Mind rune",
    json: JSON.stringify({ level: 1, exp: 5.5, damage: 2, spellbook: "standard" }),
    ...overrides,
  };
}

describe("toWikiSpell", () => {
  it("hard-gates Arceuus spells as P2P even when raw flag says F2P", () => {
    const raw = makeRaw({
      page_name: "Blood Barrage",
      spellbook: "Arceuus spellbook",
      is_members_only: "No",
      json: JSON.stringify({ level: 92, exp: 39, spellbook: "arceuus" }),
    });
    const spell = toWikiSpell(raw);
    expect(spell).not.toBeNull();
    expect(spell!.spellbook).toBe("arceuus");
    expect(spell!.members).toBe(true);
  });

  it("hard-gates Ancient spells as P2P even when raw flag says F2P", () => {
    const raw = makeRaw({
      page_name: "Ice Barrage",
      spellbook: "Ancient Magicks",
      is_members_only: "No",
      json: JSON.stringify({ level: 94, exp: 52, spellbook: "ancient" }),
    });
    const spell = toWikiSpell(raw);
    expect(spell).not.toBeNull();
    expect(spell!.spellbook).toBe("ancient");
    expect(spell!.members).toBe(true);
  });

  it("hard-gates Lunar spells as P2P even when raw flag says F2P", () => {
    const raw = makeRaw({
      page_name: "Humidify",
      spellbook: "Lunar spellbook",
      is_members_only: "No",
      json: JSON.stringify({ level: 68, exp: 65, spellbook: "lunar" }),
    });
    const spell = toWikiSpell(raw);
    expect(spell).not.toBeNull();
    expect(spell!.spellbook).toBe("lunar");
    expect(spell!.members).toBe(true);
  });

  it("respects the raw F2P flag for Standard spellbook", () => {
    const raw = makeRaw({
      page_name: "Wind Strike",
      spellbook: "Standard spellbook",
      is_members_only: "No",
      json: JSON.stringify({ level: 1, exp: 5.5, spellbook: "standard" }),
    });
    const spell = toWikiSpell(raw);
    expect(spell).not.toBeNull();
    expect(spell!.spellbook).toBe("normal");
    expect(spell!.members).toBe(false);
  });
});
