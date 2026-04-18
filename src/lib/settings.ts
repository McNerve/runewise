import { loadJSON, saveJSON } from "./localStorage";

const STORAGE_KEY = "runewise_settings";

export interface KeybindMap {
  [action: string]: string;
}

export interface AppSettings {
  theme: "dark" | "light" | "system";
  keybinds: KeybindMap;
  keybindsEnabled: boolean;
  notifications: { priceAlerts: boolean; farming: boolean; stars: boolean; milestones: boolean };
  sidebar: { collapsed: boolean; pinned: string[] };
  ironmanMode: boolean;
  closeToTray: boolean;
  discordRpc: boolean;
}

// Safe Cmd/Ctrl keybinds — avoids system shortcuts (C/X/V/Z/A/S/Q/W/F/R/N/P/O/H/L)
export const DEFAULT_KEYBINDS: KeybindMap = {
  // Player
  overview: "1",
  tracker: "2",
  // Tools
  "skill-calc": "3",
  "dps-calc": "4",
  "dry-calc": "d",
  "gear-compare": "g",
  "money-making": "m",
  timers: "t",
  "training-plan": "y",
  // Bossing
  bosses: "5",
  raids: "i",
  // Market
  market: "6",
  loot: "7",
  // Guides
  progress: "8",
  slayer: "b",
  "clue-helper": "j",
  // Live
  "world-map": "e",
  news: "9",
  wiki: "0",
  // Market
  "flip-journal": "l",
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  keybinds: DEFAULT_KEYBINDS,
  keybindsEnabled: true,
  notifications: { priceAlerts: true, farming: true, stars: false, milestones: true },
  sidebar: { collapsed: false, pinned: [] },
  ironmanMode: false,
  closeToTray: false,
  discordRpc: false,
};

export function loadSettings(): AppSettings {
  const saved = loadJSON<Partial<AppSettings>>(STORAGE_KEY, {});
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    keybinds: { ...DEFAULT_KEYBINDS, ...saved.keybinds },
    notifications: { ...DEFAULT_SETTINGS.notifications, ...saved.notifications },
    sidebar: { ...DEFAULT_SETTINGS.sidebar, ...saved.sidebar },
    keybindsEnabled: saved.keybindsEnabled ?? true,
    ironmanMode: saved.ironmanMode ?? false,
    closeToTray: saved.closeToTray ?? false,
    discordRpc: saved.discordRpc ?? false,
  };
}

export function persistSettings(settings: AppSettings): void {
  saveJSON(STORAGE_KEY, settings);
}

export function applyTheme(theme: AppSettings["theme"]): void {
  const html = document.documentElement;
  if (theme === "system") {
    const prefersDark = !window.matchMedia("(prefers-color-scheme: light)").matches;
    html.classList.toggle("light-theme", !prefersDark);
  } else {
    html.classList.toggle("light-theme", theme === "light");
  }
}
