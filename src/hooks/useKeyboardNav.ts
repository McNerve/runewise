import { useEffect } from "react";
import type { View } from "../App";

const SHORTCUTS: Record<string, View> = {
  "1": "overview",
  "2": "skill-calc",
  "3": "combat-calc",
  "4": "dry-calc",
  "5": "ge",
  "6": "item-db",
  "7": "xp-table",
  "8": "drops",
  "9": "tracker",
  "0": "news",
};

export function useKeyboardNav(onNavigate: (view: View) => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      // Cmd/Ctrl + number for navigation
      if (e.metaKey || e.ctrlKey) {
        const view = SHORTCUTS[e.key];
        if (view) {
          e.preventDefault();
          onNavigate(view);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNavigate]);
}
