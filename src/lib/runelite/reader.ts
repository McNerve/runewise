import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "../env";

export interface RuneLiteStatus {
  found: boolean;
  directory: string | null;
  checkedPaths: string[];
}

export interface RuneLiteProfile {
  id: string;
  displayName: string;
}

export interface LootEntry {
  type: string;
  name: string;
  kills: number;
  drops: { id: number; name: string; quantity: number; price: number }[];
}

interface RuneLiteStatusPayload {
  found: boolean;
  directory: string | null;
  checked_paths: string[];
}

interface RuneLiteProfilePayload {
  id: string;
  display_name: string;
}

export async function getRuneLiteStatus(): Promise<RuneLiteStatus> {
  if (!isTauri) {
    return { found: false, directory: null, checkedPaths: [] };
  }

  const status = await invoke<RuneLiteStatusPayload>("runelite_status");
  return {
    found: status.found,
    directory: status.directory,
    checkedPaths: status.checked_paths,
  };
}

export async function checkRuneLiteExists(): Promise<boolean> {
  const status = await getRuneLiteStatus();
  return status.found;
}

export async function readProfiles(): Promise<RuneLiteProfile[]> {
  if (!isTauri) return [];

  const profiles = await invoke<RuneLiteProfilePayload[]>("runelite_read_profiles");
  return profiles.map((profile) => ({
    id: profile.id,
    displayName: profile.display_name,
  }));
}

export async function readLootTracker(profileId: string): Promise<LootEntry[]> {
  if (!isTauri) return [];
  return invoke<LootEntry[]>("runelite_read_loot_tracker", { profileId });
}
