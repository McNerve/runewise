import { loadJSON, saveJSON } from "./localStorage";

const STORAGE_KEY = "runewise_settings";

export interface KeybindMap {
  [action: string]: string;
}

export interface AppSettings {
  theme: "dark" | "light" | "system";
  keybinds: KeybindMap;
  notifications: { priceAlerts: boolean };
  sidebar: { collapsed: boolean };
}

export const DEFAULT_KEYBINDS: KeybindMap = {
  overview: "1",
  tracker: "2",
  "skill-calc": "3",
  "dps-calc": "4",
  bosses: "5",
  loot: "6",
  market: "7",
  progress: "8",
  stars: "9",
  wiki: "0",
  lookup: "h",
  "dry-calc": "r",
  "pet-calc": "p",
  "combat-tasks": "t",
  slayer: "b",
  "clue-helper": "c",
  "money-making": "m",
  news: "n",
  timers: "f",
  "xp-table": "x",
  watchlist: "w",
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  keybinds: DEFAULT_KEYBINDS,
  notifications: { priceAlerts: true },
  sidebar: { collapsed: false },
};

export function loadSettings(): AppSettings {
  const saved = loadJSON<Partial<AppSettings>>(STORAGE_KEY, {});
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    keybinds: { ...DEFAULT_KEYBINDS, ...saved.keybinds },
    notifications: { ...DEFAULT_SETTINGS.notifications, ...saved.notifications },
    sidebar: { ...DEFAULT_SETTINGS.sidebar, ...saved.sidebar },
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
