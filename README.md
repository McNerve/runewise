# RuneWise

[![CI](https://github.com/McNerve/runewise/actions/workflows/ci.yml/badge.svg)](https://github.com/McNerve/runewise/actions/workflows/ci.yml)
[![Latest Release](https://img.shields.io/github/v/release/McNerve/runewise)](https://github.com/McNerve/runewise/releases/latest)
[![License: MIT](https://img.shields.io/github/license/McNerve/runewise)](LICENSE)
[![Downloads](https://img.shields.io/github/downloads/McNerve/runewise/total)](https://github.com/McNerve/runewise/releases)

A lightweight desktop companion app for Old School RuneScape. All the tools you need in one place — no browser tabs, no ads, no bloat.

**8MB native app. macOS and Windows.**

## Features

### Player
- **Overview** — Look up any RSN. Combat level, total level, EHP/EHB, quest points, collection log, boss kill counts with sprites, clue scroll breakdown, minigame KCs, and all 24 skills.
- **XP Tracker** — XP gains, boss kills, achievements, records, and name history via Wise Old Man.

### Tools
- **Skill Calculators** — All 24 skills including Sailing. Auto-fills XP from Hiscores. 120+ training methods with XP/hr, level requirements, cost estimates.
- **Combat Calculator** — Combat level with dominant style detection.
- **Dry Calculator** — Drop probability with 68 boss presets and confidence levels.
- **DPS Calculator** — Damage-per-second calculations with monster database.
- **Pet Chance** — 60+ pets (skilling, boss, raid, minigame) with kill count and action-based calculators.
- **XP Table** — Full level 1-99 XP reference.
- **Farm Timers** — Growth cycle tracking for farming patches.

### Bossing
- **Boss Guides** — Requirements, equipment setups, and strategy for 30+ bosses. Shows your KC from Hiscores. Wiki content with images.
- **Loot** — Drop tables with item icons, rarity bars, and live GE prices. Boss loot calculator with expected GP/kill and GP/hour.
- **Combat Tasks** — All 637 combat achievements organized by tier.

### Market
- **Market** — Unified item search with live GE prices, buy/sell margins, price charts (line + candlestick), high alch values, and Add to Watchlist — all in one view.
- **Alch Profits** — High alchemy profit table with sorting and filtering.
- **Watchlist** — Track item prices with configurable alert thresholds.

### Guides
- **Progress** — 179 quests with skill requirement tracking + all 13 diary regions with reward info, in a merged tabbed view.
- **Slayer Helper** — Task weights for 5 masters with per-master block list calculator.
- **Clue Helper** — 730 clue scroll entries (anagrams, ciphers, coordinates, cryptics, emotes, maps) with solutions.
- **Money Making** — 62 methods with GP/hr and skill requirements.

### Live
- **Shooting Stars** — Live star tracker via Star Miners API with world, tier, time remaining, and teleport suggestions. Reference guide with stardust shop rewards.
- **OSRS News** — Official blog posts with inline reading and status filters.
- **RuneLite Integration** — Reads loot tracker data from RuneLite profiles. Email addresses auto-redacted for privacy.

### App
- **Settings** — Dark/Light/System theme, configurable keyboard shortcuts, notification preferences.
- **Global Search** — Cmd+K to search across skills, bosses, pages, and items.
- **Collapsible Sidebar** — Full or icon-only mode.
- **Auto-Updater** — Check for updates from within the app.

## Install

[Download the latest release](https://github.com/McNerve/runewise/releases/latest) for your platform.

### Windows
1. Download the `.exe` or `.msi` installer
2. Run the installer — Windows may show SmartScreen warning. Click **More info** then **Run anyway**.
3. RuneWise launches automatically.

### macOS (Apple Silicon — M1/M2/M3/M4)
1. Download the `aarch64.dmg`
2. Drag RuneWise to Applications.
3. First launch: **System Settings > Privacy & Security > Open Anyway**.

### macOS (Intel)
1. Download the `x64.dmg`
2. Same steps as above.

## How It Works

RuneWise pulls data from public OSRS APIs. No login required, no credentials, no game client interaction.

| Source | What it provides |
|--------|-----------------|
| [OSRS Hiscores](https://secure.runescape.com/m=hiscore_oldschool/) | Player stats, boss KCs, minigame scores |
| [OSRS Wiki](https://oldschool.runescape.wiki/) | Items, drop tables, boss guides, news ([CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)) |
| [Wise Old Man](https://wiseoldman.net/) | XP tracking, achievements, records, EHP/EHB ([MIT](https://github.com/wise-old-man/wise-old-man/blob/master/LICENSE)) |
| [Star Miners](https://starminers.site/) | Live shooting star locations |
| [RuneLite](https://github.com/runelite/runelite) | Clue scroll data ([BSD](https://github.com/runelite/runelite/blob/master/LICENSE)), local loot tracker |

## Stack

- **Desktop:** [Tauri v2](https://v2.tauri.app/) (Rust backend, system webview)
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4
- **Build:** GitHub Actions (macOS ARM/Intel + Windows), auto-updater via GitHub Releases

## Security & Privacy

RuneWise is fully open source.

- No account credentials are ever requested or stored
- Only your RSN (public username) is saved locally — clearable anytime
- Network access is restricted to known OSRS API domains only
- RuneLite integration reads loot tracker data only — email addresses are auto-redacted
- The app does not interact with the game client in any way

## License

MIT

---

*RuneWise is not affiliated with or endorsed by Jagex Ltd. Old School RuneScape is a trademark of Jagex Ltd. Game data provided by the [OSRS Wiki](https://oldschool.runescape.wiki/) (CC BY-NC-SA 3.0), [Wise Old Man](https://wiseoldman.net/) (MIT), and [RuneLite](https://github.com/runelite/runelite) (BSD).*
