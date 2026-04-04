/**
 * Mapping of multi-phase bosses to their wiki monster versions.
 * Keys are the base monster name, values are arrays of version strings
 * that match the `version` field in WikiMonster data.
 */

export interface BossPhase {
  version: string;
  label: string;
}

export const PHASE_BOSSES: Record<string, BossPhase[]> = {
  "Zulrah": [
    { version: "Serpentine", label: "Serpentine (Ranged)" },
    { version: "Magma", label: "Magma (Melee)" },
    { version: "Tanzanite", label: "Tanzanite (Magic)" },
  ],
  "Verzik Vitur": [
    { version: "Phase 1", label: "Phase 1 (Shield)" },
    { version: "Phase 2", label: "Phase 2 (Main)" },
    { version: "Phase 3", label: "Phase 3 (Final)" },
  ],
  "The Nightmare": [
    { version: "The Nightmare", label: "Standard" },
    { version: "Sleepwalkers", label: "Sleepwalkers" },
  ],
  "Alchemical Hydra": [
    { version: "Poison", label: "Poison (Green)" },
    { version: "Lightning", label: "Lightning (Blue)" },
    { version: "Flame", label: "Flame (Red)" },
    { version: "Enraged", label: "Enraged (Grey)" },
  ],
  "Kalphite Queen": [
    { version: "1st form", label: "Phase 1 (Melee)" },
    { version: "2nd form", label: "Phase 2 (Ranged)" },
  ],
  "Cerberus": [
    { version: "Standard", label: "Standard" },
  ],
  "Grotesque Guardians": [
    { version: "Dusk", label: "Dusk" },
    { version: "Dawn", label: "Dawn" },
  ],
  "Great Olm": [
    { version: "Head", label: "Head" },
    { version: "Left claw", label: "Left Claw" },
    { version: "Right claw", label: "Right Claw" },
  ],
  "Vardorvis": [
    { version: "Standard", label: "Standard" },
    { version: "Awakened", label: "Awakened" },
  ],
  "Duke Sucellus": [
    { version: "Standard", label: "Standard" },
    { version: "Awakened", label: "Awakened" },
  ],
  "The Leviathan": [
    { version: "Standard", label: "Standard" },
    { version: "Awakened", label: "Awakened" },
  ],
  "The Whisperer": [
    { version: "Standard", label: "Standard" },
    { version: "Awakened", label: "Awakened" },
  ],
};

export function getPhaseBoss(monsterName: string): BossPhase[] | null {
  return PHASE_BOSSES[monsterName] ?? null;
}
