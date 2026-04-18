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

async function resolvePermission(): Promise<boolean> {
  if (permissionState === "granted") return true;
  if (permissionState === "denied") return false;

  if (isTauri) {
    try {
      const { isPermissionGranted, requestPermission } = await import(
        "@tauri-apps/plugin-notification"
      );
      let granted = await isPermissionGranted();
      if (!granted) {
        const result = await requestPermission();
        granted = result === "granted";
      }
      permissionState = granted ? "granted" : "denied";
      if (!granted) fireDenied();
      return granted;
    } catch {
      // Fallback to browser API
    }
  }

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
  const granted = await resolvePermission();
  if (!granted) return false;

  if (isTauri) {
    try {
      // The plugin's JS `sendNotification` just calls `new window.Notification()`,
      // which is unreliable in WKWebView on macOS. Invoke the Rust command directly
      // so the OS notification center actually receives it.
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("plugin:notification|notify", { options: { title, body } });
      return true;
    } catch {
      // Fall through to browser API
    }
  }

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
    return true;
  }

  return false;
}
