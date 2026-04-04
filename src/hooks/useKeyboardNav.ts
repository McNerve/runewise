import { useEffect } from "react";
import type { View } from "../lib/NavigationContext";
import { useSettings } from "./useSettings";

export function useKeyboardNav(onNavigate: (view: View) => void) {
  const { settings } = useSettings();

  useEffect(() => {
    // Build reverse map: key -> view
    const keyToView: Record<string, View> = {};
    for (const [view, key] of Object.entries(settings.keybinds)) {
      keyToView[key] = view as View;
    }

    if (!settings.keybindsEnabled) return;

    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.metaKey || e.ctrlKey) {
        const view = keyToView[e.key];
        if (view) {
          e.preventDefault();
          onNavigate(view);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNavigate, settings.keybinds, settings.keybindsEnabled]);
}
