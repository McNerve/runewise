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

export interface RuneLiteProfile {
  id: string;       // opaque ID used for directory lookup — never displayed
  displayName: string; // safe name shown to user — emails are redacted
}

// PRIVACY: RuneLite profiles can contain email addresses, tokens, and other
// sensitive data from Google login sync. We enforce strict extraction:
// 1. Only id and name are extracted — all other fields are discarded
// 2. Email addresses are detected and redacted from display names
// 3. Profile IDs are used as directory names but never shown to the user
// 4. No raw profile JSON is ever stored in React state

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function safeDisplayName(raw: string | undefined, index: number): string {
  if (!raw) return `Profile ${index + 1}`;
  if (isEmail(raw)) return `Profile ${index + 1}`;
  if (raw.includes("@")) return `Profile ${index + 1}`;
  return raw;
}

export async function readProfiles(): Promise<RuneLiteProfile[]> {
  if (!isTauri) return [];
  try {
    const { readTextFile } = await import("@tauri-apps/plugin-fs");
    const { homeDir } = await import("@tauri-apps/api/path");
    const home = await homeDir();
    const raw = await readTextFile(`${home}.runelite/profiles2/profiles.json`);
    const data = JSON.parse(raw);

    // Strict extraction — only pull id and name, discard everything else
    const extract = (arr: unknown[]): RuneLiteProfile[] =>
      arr.map((entry, i) => {
        const obj = entry as Record<string, unknown>;
        const id = typeof obj.id === "string" ? obj.id : String(i);
        const name = typeof obj.name === "string" ? obj.name : undefined;
        return {
          id,
          displayName: safeDisplayName(name, i),
        };
      });

    if (Array.isArray(data)) return extract(data);
    if (data?.profiles && Array.isArray(data.profiles)) return extract(data.profiles);
    return [];
  } catch {
    return [];
  }
}

export interface LootEntry {
  type: string;
  name: string;
  kills: number;
  drops: { id: number; name: string; quantity: number; price: number }[];
}

export async function readLootTracker(profileId: string): Promise<LootEntry[]> {
  if (!isTauri) return [];
  try {
    const { readTextFile } = await import("@tauri-apps/plugin-fs");
    const { homeDir } = await import("@tauri-apps/api/path");
    const home = await homeDir();
    const path = `${home}.runelite/profiles2/${profileId}/loot-tracker.log`;
    const raw = await readTextFile(path);
    // RuneLite loot tracker stores one JSON object per line
    // We only extract game-related fields — no account/auth data
    const entries: LootEntry[] = [];
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        entries.push({
          type: entry.type ?? "NPC",
          name: entry.name ?? "Unknown",
          kills: entry.kills ?? 1,
          drops: Array.isArray(entry.drops)
            ? entry.drops.map((d: { id?: number; name?: string; qty?: number; quantity?: number; price?: number }) => ({
                id: d.id ?? 0,
                name: d.name ?? "Unknown",
                quantity: d.qty ?? d.quantity ?? 1,
                price: d.price ?? 0,
              }))
            : [],
        });
      } catch {
        // Skip malformed lines
      }
    }
    return entries;
  } catch {
    return [];
  }
}
