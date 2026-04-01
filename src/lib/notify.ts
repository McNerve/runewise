import { isTauri } from "./env";

export async function sendNotification(title: string, body: string): Promise<void> {
  if (isTauri) {
    try {
      const { sendNotification: tauriNotify } = await import(
        "@tauri-apps/plugin-notification"
      );
      await tauriNotify({ title, body });
      return;
    } catch {
      // Fallback to browser API
    }
  }

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  } else if ("Notification" in window && Notification.permission !== "denied") {
    const perm = await Notification.requestPermission();
    if (perm === "granted") new Notification(title, { body });
  }
}
