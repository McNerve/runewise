import { isTauri } from "../env";

export interface BossLoot {
  bossName: string;
  items: { itemId: number; quantity: number }[];
}

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

export async function readBossLoot(): Promise<BossLoot[]> {
  if (!isTauri) return [];
  try {
    const { readTextFile } = await import("@tauri-apps/plugin-fs");
    const { homeDir } = await import("@tauri-apps/api/path");
    const home = await homeDir();
    const _basePath = `${home}.runelite/bossing-info/`;

    // v1: directory reading needs fs:allow-read-dir permission
    // For now, return empty — the UI shows a "coming soon" message
    void _basePath;
    void readTextFile;
    return [];
  } catch {
    return [];
  }
}
