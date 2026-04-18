import { describe, it, expect } from "vitest";
import { toWikiRecipe, type RawBucketRecipe } from "../recipes";

function makeRaw(overrides: Partial<RawBucketRecipe> = {}): RawBucketRecipe {
  return {
    page_name: "Shark",
    uses_material: "Raw shark",
    uses_facility: "Fire",
    is_members_only: "Yes",
    is_boostable: "No",
    uses_skill: "Cooking",
    production_json: JSON.stringify({
      materials: [{ name: "Raw shark", quantity: 1 }],
      skills: [{ name: "Cooking", level: 80, experience: 210 }],
      output: [{ name: "Shark", quantity: 1 }],
      ticks: 4,
      members: true,
      facility: "Fire",
    }),
    ...overrides,
  };
}

describe("toWikiRecipe", () => {
  it("returns a WikiRecipe for a valid raw entry", () => {
    const result = toWikiRecipe(makeRaw());
    expect(result).toEqual({
      name: "Shark",
      skill: "Cooking",
      levelReq: 80,
      xp: 210,
      materials: [{ name: "Raw shark", quantity: 1 }],
      output: [{ name: "Shark", quantity: 1 }],
      facility: "Fire",
      ticks: 4,
      members: true,
      boostable: false,
    });
  });

  it("returns empty materials when production JSON has materials as an object", () => {
    const raw = makeRaw({
      production_json: JSON.stringify({
        // Wiki occasionally emits a keyed object rather than an array.
        materials: { "Raw shark": { quantity: 1 } },
        skills: [{ name: "Cooking", level: 80, experience: 210 }],
        output: [{ name: "Shark", quantity: 1 }],
      }),
    });
    const result = toWikiRecipe(raw);
    expect(result).not.toBeNull();
    expect(result!.materials).toEqual([]);
    // Doesn't crash; everything else is populated.
    expect(result!.name).toBe("Shark");
  });

  it("falls back to a default output when production JSON has output as an object", () => {
    const raw = makeRaw({
      production_json: JSON.stringify({
        materials: [{ name: "Raw shark", quantity: 1 }],
        skills: [{ name: "Cooking", level: 80, experience: 210 }],
        output: { name: "Shark", quantity: 1 }, // object, not array
      }),
    });
    const result = toWikiRecipe(raw);
    expect(result).not.toBeNull();
    expect(result!.output).toEqual([{ name: "Shark", quantity: 1 }]);
  });

  it("returns null when skill is missing", () => {
    const raw = makeRaw({
      uses_skill: undefined,
      production_json: JSON.stringify({
        materials: [],
        skills: [], // no skill entry
        output: [],
      }),
    });
    expect(toWikiRecipe(raw)).toBeNull();
  });

  it("returns null when level is missing (level === 0)", () => {
    const raw = makeRaw({
      production_json: JSON.stringify({
        materials: [],
        skills: [{ name: "Cooking", level: 0, experience: 0 }],
        output: [],
      }),
    });
    expect(toWikiRecipe(raw)).toBeNull();
  });
});
