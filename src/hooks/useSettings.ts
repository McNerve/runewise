import { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  type AppSettings,
  DEFAULT_SETTINGS,
  loadSettings,
  persistSettings,
  applyTheme,
} from "../lib/settings";

interface SettingsContextValue {
  settings: AppSettings;
  update: (patch: Partial<AppSettings>) => void;
  resetAll: () => void;
}

export const SettingsContext = createContext<SettingsContextValue>(null!);

export function useSettings() {
  return useContext(SettingsContext);
}

export function useSettingsProvider() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next: AppSettings = {
        ...prev,
        ...patch,
        keybinds: patch.keybinds
          ? { ...prev.keybinds, ...patch.keybinds }
          : prev.keybinds,
        notifications: patch.notifications
          ? { ...prev.notifications, ...patch.notifications }
          : prev.notifications,
        sidebar: patch.sidebar
          ? { ...prev.sidebar, ...patch.sidebar }
          : prev.sidebar,
        closeToTray: patch.closeToTray ?? prev.closeToTray,
        discordRpc: patch.discordRpc ?? prev.discordRpc,
      };
      persistSettings(next);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    persistSettings(DEFAULT_SETTINGS);
  }, []);

  // Apply theme on mount and when it changes
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    if (settings.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings.theme]);

  return { settings, update, resetAll };
}
