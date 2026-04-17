import { describe, it, expect } from "vitest";
import { PET_MODIFIERS, modifierDefaults } from "./pet-modifiers";

describe("Olmlet rate scaling", () => {
  const entry = PET_MODIFIERS.Olmlet;
  const base = 53;

  it("matches baseline 1/53-tier at ~867k points", () => {
    const r = entry.rate({ points: 867_500 }, base);
    expect(r).toBe(53);
  });

  it("scales inversely with points (32k baseline)", () => {
    const r32 = entry.rate({ points: 32_000 }, base);
    const r16 = entry.rate({ points: 16_000 }, base);
    expect(r16).toBeCloseTo(r32 * 2, 0);
  });

  it("32k points yields ~1/1,437", () => {
    const r = entry.rate({ points: 32_000 }, base);
    expect(Math.round(r)).toBe(1437);
  });
});

describe("Tumeken's guardian rate scaling", () => {
  const entry = PET_MODIFIERS["Tumeken's guardian"];
  const base = 350;

  it("at raid level 300 equals baseline 1/350", () => {
    expect(entry.rate({ raidLevel: 300 }, base)).toBe(350);
  });

  it("doubles the rate (halves chance) at raid level 150", () => {
    expect(entry.rate({ raidLevel: 150 }, base)).toBe(700);
  });

  it("halves the rate (doubles chance) at raid level 600", () => {
    expect(entry.rate({ raidLevel: 600 }, base)).toBe(175);
  });
});

describe("Little nightmare team-size scaling", () => {
  const entry = PET_MODIFIERS["Little nightmare"];
  const base = 800;

  it("solo = 1/800", () => {
    expect(entry.rate({ teamSize: 1, phosani: false }, base)).toBe(800);
  });

  it("team of 5 = 1/4000", () => {
    expect(entry.rate({ teamSize: 5, phosani: false }, base)).toBe(4_000);
  });

  it("Phosani's overrides team size with flat 1/1400", () => {
    expect(entry.rate({ teamSize: 3, phosani: true }, base)).toBe(1_400);
  });
});

describe("Dom delve-level scaling", () => {
  const entry = PET_MODIFIERS.Dom;
  const base = 1_000;

  it("delve 6 = 1/1000", () => {
    expect(entry.rate({ delve: "6" }, base)).toBe(1_000);
  });

  it("delve 7 = 1/750", () => {
    expect(entry.rate({ delve: "7" }, base)).toBe(750);
  });

  it("delve 8 = 1/500", () => {
    expect(entry.rate({ delve: "8" }, base)).toBe(500);
  });

  it("delve 9+ = 1/250", () => {
    expect(entry.rate({ delve: "9" }, base)).toBe(250);
  });
});

describe("Slayer task boosts", () => {
  it("Jal-nib-rek base 1/100 → 1/75 on task", () => {
    const entry = PET_MODIFIERS["Jal-nib-rek"];
    expect(entry.rate({ onTask: false }, 100)).toBe(100);
    expect(entry.rate({ onTask: true }, 100)).toBe(75);
  });

  it("Tzrek-jad base 1/200 → 1/100 on task", () => {
    const entry = PET_MODIFIERS["Tzrek-jad"];
    expect(entry.rate({ onTask: false }, 200)).toBe(200);
    expect(entry.rate({ onTask: true }, 200)).toBe(100);
  });
});

describe("ToB mode toggle", () => {
  const entry = PET_MODIFIERS["Lil' zik"];

  it("Normal mode = 1/650", () => {
    expect(entry.rate({ hardMode: false }, 650)).toBe(650);
  });

  it("Hard Mode = 1/500", () => {
    expect(entry.rate({ hardMode: true }, 650)).toBe(500);
  });
});

describe("Yami contract toggle", () => {
  const entry = PET_MODIFIERS.Yami;

  it("off-contract = 1/2500", () => {
    expect(entry.rate({ contract: false }, 2_500)).toBe(2_500);
  });

  it("contract = 1/100", () => {
    expect(entry.rate({ contract: true }, 2_500)).toBe(100);
  });
});

describe("modifierDefaults", () => {
  it("seeds all defined defaults", () => {
    const d = modifierDefaults(PET_MODIFIERS["Little nightmare"]);
    expect(d.teamSize).toBe(1);
    expect(d.phosani).toBe(false);
  });

  it("selects have string defaults", () => {
    const d = modifierDefaults(PET_MODIFIERS.Dom);
    expect(d.delve).toBe("6");
  });
});
