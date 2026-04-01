# RuneWise

A lightweight desktop companion app for Old School RuneScape. All the tools you need in one place — no browser tabs, no ads, no bloat.

**8MB app. Native on macOS and Windows.**

## Features

- **Player Overview** — Look up any player by RSN. Combat level, total level, total XP, and all 24 skills at a glance.
- **Skill Calculators** — All 24 skills including Sailing. Auto-fills your current XP from the Hiscores.
- **Combat Calculator** — Combat level with dominant style detection. Auto-fills from Hiscores.
- **Dry Calculator** — Drop probability with 40+ boss presets. Confidence levels and progress tracking.
- **Grand Exchange** — Live item prices with buy/sell margins, high alch values, and buy limits.
- **Item Database** — 4,500+ items searchable with F2P/P2P filter.
- **Drop Tables** — Full drop table for any monster, pulled from the OSRS Wiki.
- **XP Tracker** — XP gains, boss kills, achievements, and personal records via Wise Old Man.
- **Boss Guides** — Requirements, equipment, and strategy for 30+ bosses.
- **Quest Tracker** — Skill requirements checked against your stats. See what you can complete.
- **Achievement Diaries** — All 12 regions with requirement tracking and reward info.
- **Slayer Helper** — Task weights per master with interactive block list calculator.
- **OSRS News** — Official blog posts with Shipped / Proposed / Upcoming filters.

## Install

[Download the latest release](https://github.com/McNerve/runewise/releases) for your platform.

### Windows
1. Download `RuneWise_0.1.0_x64-setup.exe` or `RuneWise_0.1.0_x64_en-US.msi`
2. Run the installer — Windows may show "Windows protected your PC" (SmartScreen). Click **More info** then **Run anyway**. This is normal for unsigned apps.
3. RuneWise installs to your Start Menu and launches automatically.

### macOS (Apple Silicon — M1/M2/M3/M4)
1. Download `RuneWise_0.1.0_aarch64.dmg`
2. Open the DMG and drag RuneWise to Applications.
3. On first launch, macOS may block it. Go to **System Settings → Privacy & Security** and click **Open Anyway**.

### macOS (Intel)
1. Download `RuneWise_0.1.0_x64.dmg`
2. Same steps as above.

## How It Works

RuneWise pulls data from public OSRS APIs. No login required, no account credentials, no game client interaction.

| Source | What it provides |
|--------|-----------------|
| [OSRS Hiscores](https://secure.runescape.com/m=hiscore_oldschool/) | Player stats |
| [OSRS Wiki](https://oldschool.runescape.wiki/) | Item data, drop tables, boss guides, news |
| [Wise Old Man](https://wiseoldman.net/) | XP tracking, achievements, records |

## Security

RuneWise is fully open source. You can inspect every line of code.

- No account credentials are ever requested or stored
- Only your RSN (public username) is saved locally — clearable anytime
- Network access is restricted to known OSRS domains only
- The app does not interact with the game client in any way

## License

MIT

---

*RuneWise is not affiliated with or endorsed by Jagex Ltd. Old School RuneScape is a trademark of Jagex Ltd. Game data provided by the [OSRS Wiki](https://oldschool.runescape.wiki/) (CC BY-NC-SA 3.0) and [Wise Old Man](https://wiseoldman.net/) (MIT).*
