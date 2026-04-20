import { isTauri } from "./env";

type PermissionState = "granted" | "denied" | "unknown";

// Module-level cache so we only request permission once per session.
let permissionState: PermissionState = "unknown";

// Callbacks registered by UI components to display a denied banner.
const deniedListeners: Array<() => void> = [];

export function onNotificationDenied(cb: () => void): () => void {
  deniedListeners.push(cb);
  return () => {
    const i = deniedListeners.indexOf(cb);
    if (i !== -1) deniedListeners.splice(i, 1);
  };
}

function fireDenied() {
  for (const cb of deniedListeners) cb();
}

/**
 * Reset the cached permission state. Call this after the user changes macOS
 * System Settings → Notifications so the next check re-queries the OS.
 */
export function resetNotificationPermissionCache(): void {
  permissionState = "unknown";
}

/**
 * The last low-level error from a Tauri notify attempt, exposed so the
 * settings "Test notification" button can surface it instead of a generic
 * "Permission denied" when the real failure is something else (e.g. the
 * plugin command threw, OS dropped it, etc.).
 */
let lastNotifyError: string | null = null;
export function getLastNotifyError(): string | null {
  return lastNotifyError;
}

async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(cmd, args);
}

async function resolvePermission(): Promise<boolean> {
  if (permissionState === "granted") return true;
  if (permissionState === "denied") return false;

  if (isTauri) {
    // IMPORTANT: don't use @tauri-apps/plugin-notification's JS helpers here.
    // isPermissionGranted() checks window.Notification.permission *first*,
    // which in WKWebView on macOS always returns "denied" — so the plugin
    // never falls through to the Rust command. Hit this bug in v1.9.0;
    // calling the Rust command directly is the reliable path.
    try {
      // Returns Some(true|false) when the OS knows, None when we need to ask.
      const granted = await tauriInvoke<boolean | null>(
        "plugin:notification|is_permission_granted",
      );
      if (granted === true) {
        permissionState = "granted";
        return true;
      }
      if (granted === false) {
        permissionState = "denied";
        fireDenied();
        return false;
      }
      // granted === null → prompt the user via the Rust command. Returns the
      // new state as a string ("granted" | "denied").
      const result = await tauriInvoke<string>(
        "plugin:notification|request_permission",
      );
      const ok = result === "granted";
      permissionState = ok ? "granted" : "denied";
      if (!ok) fireDenied();
      return ok;
    } catch (err) {
      lastNotifyError = `permission check failed: ${err instanceof Error ? err.message : String(err)}`;
      // If the Rust command itself threw (plugin not registered, etc.),
      // we cannot deliver — treat as denied rather than silently downgrading
      // to the broken web path.
      permissionState = "denied";
      fireDenied();
      return false;
    }
  }

  // Browser-only path (vite dev server, etc.) — fall back to web API.
  if (!("Notification" in window)) {
    permissionState = "denied";
    return false;
  }
  if (Notification.permission === "granted") {
    permissionState = "granted";
    return true;
  }
  if (Notification.permission === "denied") {
    permissionState = "denied";
    fireDenied();
    return false;
  }
  const perm = await Notification.requestPermission();
  permissionState = perm === "granted" ? "granted" : "denied";
  if (permissionState === "denied") fireDenied();
  return permissionState === "granted";
}

export async function sendNotification(title: string, body: string): Promise<boolean> {
  lastNotifyError = null;
  const granted = await resolvePermission();
  if (!granted) return false;

  if (isTauri) {
    try {
      // The plugin's JS sendNotification() uses new window.Notification(),
      // which WKWebView on macOS silently drops. Always invoke the Rust
      // command so the OS notification center actually receives it.
      //
      // `sound: "NSUserNotificationDefaultSoundName"` is the magic string
      // the macOS notification backend (mac-notification-sys) recognises as
      // the default system alert sound. Any other value would be treated as
      // a custom sound name and silently play nothing.
      await tauriInvoke("plugin:notification|notify", {
        options: {
          title,
          body,
          sound: "NSUserNotificationDefaultSoundName",
        },
      });
      return true;
    } catch (err) {
      lastNotifyError = `notify invoke failed: ${err instanceof Error ? err.message : String(err)}`;
      // Don't fall through to window.Notification — it's broken in WKWebView
      // and would give the user a false positive.
      return false;
    }
  }

  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { body });
      return true;
    } catch (err) {
      lastNotifyError = String(err);
      return false;
    }
  }

  return false;
}
