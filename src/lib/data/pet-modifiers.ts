export type ModifierDef =
  | { kind: "slider"; id: string; label: string; min: number; max: number; default: number; step?: number }
  | { kind: "toggle"; id: string; label: string; default?: boolean }
  | { kind: "select"; id: string; label: string; options: { value: string; label: string }[]; default: string };

export type ModifierState = Record<string, number | boolean | string>;

export interface PetModifierEntry {
  modifiers: ModifierDef[];
  rate: (state: ModifierState, base: number) => number;
}

export const PET_MODIFIERS: Record<string, PetModifierEntry> = {
  // CoX — 1/53 roll per unique reward. Unique chance = points / 867,500.
  // Realistic solo range is 200k-570k points; CM pushes higher.
  Olmlet: {
    modifiers: [
      { kind: "slider", id: "points", label: "Points per completion", min: 50_000, max: 800_000, default: 300_000, step: 10_000 },
    ],
    rate: (state) => {
      const points = Math.max(1, Number(state.points) || 300_000);
      return (867_500 * 53) / points;
    },
  },

  // ToB — 1/650 Normal, 1/500 HM. Performance scaling (which can push to ~1/6,500)
  // is opaque; we expose the mode toggle only.
  "Lil' zik": {
    modifiers: [
      { kind: "toggle", id: "hardMode", label: "Hard Mode", default: false },
    ],
    rate: (state) => (state.hardMode ? 500 : 650),
  },

  // ToA — baseline 1/350 at raid level 300, linearly scaling with raid level.
  // Capped at raid level 0 (no unique rolls) and at 600 (diminishing returns in-game).
  // Approximate: rate = 350 * (300 / max(50, raidLevel)).
  "Tumeken's guardian": {
    modifiers: [
      { kind: "slider", id: "raidLevel", label: "Raid level", min: 0, max: 600, default: 300, step: 10 },
    ],
    rate: (state) => {
      const rl = Math.max(50, Number(state.raidLevel) || 300);
      return Math.round(350 * (300 / rl));
    },
  },

  // Nightmare — 1/800 solo, scales linearly with team size to 1/4000 at 5+.
  // Phosani's is a separate encounter with a flat 1/1,400.
  "Little nightmare": {
    modifiers: [
      { kind: "toggle", id: "phosani", label: "Phosani's Nightmare", default: false },
      { kind: "slider", id: "teamSize", label: "Team size", min: 1, max: 5, default: 1, step: 1 },
    ],
    rate: (state) => {
      if (state.phosani) return 1_400;
      const size = Math.max(1, Math.min(5, Number(state.teamSize) || 1));
      return 800 * size;
    },
  },

  // Dom — rate depends on deepest delve level reached on the kill.
  Dom: {
    modifiers: [
      {
        kind: "select",
        id: "delve",
        label: "Delve level",
        options: [
          { value: "6", label: "Delve 6" },
          { value: "7", label: "Delve 7" },
          { value: "8", label: "Delve 8" },
          { value: "9", label: "Delve 9+" },
        ],
        default: "6",
      },
    ],
    rate: (state) => {
      switch (state.delve) {
        case "9": return 250;
        case "8": return 500;
        case "7": return 750;
        default: return 1_000;
      }
    },
  },

  // Slayer task boosts — Jal-nib-rek 1/100 → 1/75, Tzrek-jad 1/200 → 1/100.
  "Jal-nib-rek": {
    modifiers: [
      { kind: "toggle", id: "onTask", label: "On Slayer task", default: false },
    ],
    rate: (state) => (state.onTask ? 75 : 100),
  },
  "Tzrek-jad": {
    modifiers: [
      { kind: "toggle", id: "onTask", label: "On Slayer task", default: false },
    ],
    rate: (state) => (state.onTask ? 100 : 200),
  },

  // Yami — 1/2,500 default; 1/100 when killed under an active Contract of familiar acquisition.
  Yami: {
    modifiers: [
      { kind: "toggle", id: "contract", label: "Contract of familiar acquisition", default: false },
    ],
    rate: (state) => (state.contract ? 100 : 2_500),
  },

  // Wilderness-lite variants — lower-tier boss drops the pet at ~1/2,800 vs ~1/1,500.
  "Callisto cub": {
    modifiers: [
      { kind: "toggle", id: "artio", label: "Artio (wilderness-lite)", default: false },
    ],
    rate: (state) => (state.artio ? 2_800 : 1_500),
  },
  "Vet'ion jr.": {
    modifiers: [
      { kind: "toggle", id: "calvarion", label: "Calvar'ion (wilderness-lite)", default: false },
    ],
    rate: (state) => (state.calvarion ? 2_800 : 1_500),
  },
  "Venenatis spiderling": {
    modifiers: [
      { kind: "toggle", id: "spindel", label: "Spindel (wilderness-lite)", default: false },
    ],
    rate: (state) => (state.spindel ? 2_800 : 1_500),
  },

  // Pet chaos elemental — Chaos Elemental 1/300, Chaos Fanatic 1/1,000.
  "Pet chaos elemental": {
    modifiers: [
      { kind: "toggle", id: "fanatic", label: "Chaos Fanatic", default: false },
    ],
    rate: (state) => (state.fanatic ? 1_000 : 300),
  },

  // Youngllef — Corrupted Gauntlet 1/800, normal Gauntlet 1/2,000.
  Youngllef: {
    modifiers: [
      { kind: "toggle", id: "normal", label: "Normal Gauntlet", default: false },
    ],
    rate: (state) => (state.normal ? 2_000 : 800),
  },
};

export function modifierDefaults(entry: PetModifierEntry): ModifierState {
  const state: ModifierState = {};
  for (const m of entry.modifiers) {
    if (m.kind === "toggle") state[m.id] = m.default ?? false;
    else if (m.kind === "slider") state[m.id] = m.default;
    else state[m.id] = m.default;
  }
  return state;
}
