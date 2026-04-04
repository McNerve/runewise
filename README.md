# RuneWise

[![CI](https://github.com/McNerve/runewise/actions/workflows/ci.yml/badge.svg)](https://github.com/McNerve/runewise/actions/workflows/ci.yml)
[![Latest Release](https://img.shields.io/github/v/release/McNerve/runewise)](https://github.com/McNerve/runewise/releases/latest)
[![License: MIT](https://img.shields.io/github/license/McNerve/runewise)](LICENSE)
[![Downloads](https://img.shields.io/github/downloads/McNerve/runewise/total)](https://github.com/McNerve/runewise/releases)

Your all-in-one OSRS desktop companion. DPS calculators, boss guides, drop tables, skill planners, GE prices, shop data, and 30+ tools — all in a single lightweight app.

**No browser tabs. No ads. No bloat. 8MB native app.**

## Download

> **Pick the right file for your system:**

| Platform | File | Notes |
|----------|------|-------|
| **Windows** | `.exe` installer | May show SmartScreen warning — click "More info" → "Run anyway" |
| **macOS (M1/M2/M3/M4)** | `aarch64.dmg` | First launch: System Settings → Privacy & Security → Open Anyway |
| **macOS (Intel)** | `x64.dmg` | Same as above |

**[→ Download Latest Release](https://github.com/McNerve/runewise/releases/latest)**

Updates are automatic — RuneWise checks for new versions and installs them in the background.

## Features

### 30+ Tools in One App

**Player**
- Profile overview with stats, boss KCs, collection log, EHP/EHB
- XP Tracker with gains, achievements, records (via Wise Old Man)
- Ironman mode auto-detection — filters training methods and shows relevant warnings

**Calculators**
- Skill Calculator — 24 skills, 140+ training methods with XP/hr, intensity badges, cost estimates
- DPS Calculator — 3,172 monsters, 16 modifiers, phase-based bosses, special attack DPS, spell selection, raid scaling, loadout comparison
- Training Plan — optimal method sequences with time/cost estimates
- Dry Calculator — drop probability with 68 boss presets
- Pet Calculator — 60+ pets with KC/action-based odds
- Production Calculator — recipe costs + profits for bulk crafting

**Bossing**
- Boss Guides — wiki strategy content, equipment loadouts, mechanics for 58 bosses
- Raid Guides — CoX, ToB, ToA room reference with loot calculators
- Drop Tables — rarity bars, live GE prices, GP/kill, GP/hr
- Combat Achievements — all 637 tasks organized by tier

**Market**
- Item search with live GE prices, margins, price charts, high alch values
- Rich item tooltips — hover any item name to see GE price, alch value, examine text
- Watchlist with price alerts
- Alch profit table

**Guides**
- Quest tracker (225 quests) + Achievement Diaries (13 regions)
- Slayer Helper — task weights, block calculator, reward shop with unlock tracking, strategy guides
- Shop Helper — 580+ OSRS shops with stock, prices, GE comparison, and savings indicators
- Clue Helper — 730 solutions
- Spellbook — 224 spells across 4 spellbooks

**Live**
- World Map with wiki tile markers
- Shooting Stars — live tracker with tier, world, time remaining
- OSRS News — blog posts with inline reading
- Wiki Lookup — search and read any wiki page in-app

**App**
- Dark / Light / System theme
- Configurable keyboard shortcuts (Cmd/Ctrl + key) with disable toggle
- Global search (Cmd+K)
- Collapsible sidebar
- Auto-updater

## How It Works

RuneWise pulls data from public OSRS APIs. No login required, no credentials stored, no game client interaction.

| Source | What it provides |
|--------|-----------------|
| [OSRS Wiki](https://oldschool.runescape.wiki/) | Items, drops, bosses, shops, spells, quests, news ([CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)) |
| [OSRS Hiscores](https://secure.runescape.com/m=hiscore_oldschool/) | Player stats, boss KCs, ironman detection |
| [Wise Old Man](https://wiseoldman.net/) | XP tracking, achievements, records ([MIT](https://github.com/wise-old-man/wise-old-man/blob/master/LICENSE)) |
| [Temple OSRS](https://templeosrs.com/) | Collection log data |
| [Star Miners](https://starminers.site/) | Live shooting star locations |
| [RuneLite](https://github.com/runelite/runelite) | Clue data ([BSD](https://github.com/runelite/runelite/blob/master/LICENSE)) |

## Privacy & Security

- Fully open source — audit every line
- No account credentials ever requested or stored
- Only your RSN (public username) is saved locally
- Network access restricted to known OSRS API domains
- The app does not interact with the game client

## Built With

[Tauri v2](https://v2.tauri.app/) (Rust) · React 19 · TypeScript · Vite · Tailwind CSS 4

## License

MIT

---

*RuneWise is not affiliated with or endorsed by Jagex Ltd. Old School RuneScape is a trademark of Jagex Ltd.*
