import { isTauri } from "../env";

export async function checkRuneLiteExists(): Promise<boolean> {
  if (!isTauri) return false;
  try {
    const { exists } = await import("@tauri-apps/plugin-fs");
    const { homeDir } = await import("@tauri-apps/api/path");
    const home = await homeDir();
    return await exists(`${home}.runelite/profiles2/profiles.json`);
  } catch {
    return false;
  }
}
