export const isTauri = "__TAURI_INTERNALS__" in window;

export const isMac =
  typeof navigator !== "undefined" && navigator.platform.toUpperCase().includes("MAC");
