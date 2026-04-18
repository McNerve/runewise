/**
 * Discord Rich Presence integration.
 *
 * To use this feature, register a Discord application at:
 *   https://discord.com/developers/applications
 * Then update the DISCORD_APP_ID constant in src-tauri/src/lib.rs with your app's client ID.
 *
 * The `discordRpc` setting (Settings > App) must be enabled by the user.
 * Default: off (privacy first).
 */

import { invoke } from "@tauri-apps/api/core";
import type { View } from "./features";

// Route → human-readable activity label
const ROUTE_LABELS: Partial<Record<View, string>> = {
  home: "Browsing RuneWise",
  overview: "Checking their profile",
  lookup: "Looking up a player",
  "dps-calc": "Theorycrafting DPS",
  "skill-calc": "Planning skill training",
  "dry-calc": "Checking drop chances",
  "gear-compare": "Comparing gear",
  "money-making": "Hunting GP/hr",
  "pet-calc": "Calculating pet chance",
  "training-plan": "Planning a training route",
  bosses: "Reading boss guides",
  raids: "Planning a raid run",
  loot: "Checking drop tables",
  progress: "Tracking quest progress",
  slayer: "Planning Slayer tasks",
  "clue-helper": "Solving a clue scroll",
  market: "Browsing the GE",
  stars: "Tracking shooting stars",
  timers: "Watching farm timers",
  wiki: "Reading the Wiki",
  news: "Catching up on OSRS news",
  tracker: "Checking XP gains",
  "collection-log": "Reviewing collection log",
  settings: "In settings",
  spells: "Browsing spells",
  "world-map": "Checking the world map",
  kingdom: "Managing the Kingdom",
  "production-calc": "Calculating recipes",
  "shop-helper": "Browsing shops",
};

let lastUpdateAt = 0;
const DEBOUNCE_MS = 10_000;

export async function initDiscordRpc(): Promise<void> {
  try {
    await invoke("init_discord_presence");
  } catch {
    // Discord not running or app ID not configured — fail silently
  }
}

export async function updateDiscordRpc(view: View, rsn: string): Promise<void> {
  const now = Date.now();
  if (now - lastUpdateAt < DEBOUNCE_MS) return;
  lastUpdateAt = now;

  const activityLabel = ROUTE_LABELS[view] ?? "Using RuneWise";
  const details = rsn ? `Playing as ${rsn}` : "OSRS Companion App";

  try {
    await invoke("update_discord_presence", {
      activityLabel,
      details,
    });
  } catch {
    // Discord disconnected or not running — fail silently
  }
}

export async function clearDiscordRpc(): Promise<void> {
  try {
    await invoke("clear_discord_presence");
  } catch { /* ignore */ }
}
