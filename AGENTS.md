# AGENTS.md — RuneWise

## Overview

OSRS desktop companion app. Tauri (Rust + webview) with React + Vite frontend. Pulls live data from OSRS Wiki API, Hiscores, and Wise Old Man. 14 views, ~4000 LOC, 8MB native app.

**RSN:** Raxor

---

## Stack

- **Desktop:** Tauri v2 (Rust backend, system webview)
- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS 4 (dark mode, CSS custom properties)
- **Data:** OSRS Wiki API (prices, drops, bosses), Hiscores API, Wise Old Man API
- **Build:** GitHub Actions (macOS ARM/Intel + Windows), auto-updater via GitHub releases

---

## Features (Shipped)

- **Overview** — Player stats with combat/total/XP + quest points, combat tasks, collection log
- **Skill Calculators** — All 24 skills (including Sailing), training methods with XP/hr and time estimates
- **Combat Calculator** — Combat level with dominant style detection
- **Dry Calculator** — Drop probability with 40+ boss presets
- **Grand Exchange** — Live prices, margins, high alch values. Click items for details
- **Item Database** — 4,500+ items with detail panel, Wiki images, F2P/P2P filter
- **XP Table** — Level 1–99 reference
- **Drop Tables** — Wiki drop tables with rarity bars and live GE prices
- **XP Tracker** — Wise Old Man integration (gains, achievements, records)
- **Boss Guides** — Full wiki content with images, equipment, strategy for 30+ bosses
- **Quest Tracker** — Skill requirements checked against hiscores
- **Achievement Diaries** — 12 regions, 4 tiers, requirement tracking
- **Slayer Helper** — 5 masters with per-master block lists and probability recalculation
- **OSRS News** — Blog posts with inline reading and status filters

### Future
- Shooting star tracker (Star Miners API)
- RuneLite local data integration (bank, loot tracker)
- Price watchlist with native notifications
- High Alchemy profit table
- Multi-panel layouts

---

## Architecture

```
runewise/
├── src-tauri/          # Rust backend (HTTP proxy, updater, plugins)
│   └── src/
│       ├── main.rs
│       └── lib.rs      # proxy_fetch command, LazyLock HTTP client
├── src/                # React frontend
│   ├── components/     # Shared UI (Sidebar, PlayerBar, Skeleton)
│   ├── features/       # Feature modules (one folder per view, lazy-loaded)
│   ├── hooks/          # useHiscores, useDebounce, useKeyboardNav
│   ├── lib/
│   │   ├── api/        # API clients + TTL cache (cache.ts, fetch.ts)
│   │   ├── formulas/   # OSRS math (xp.ts, combat.ts, dry.ts)
│   │   ├── data/       # Static game data (bosses, quests, slayer, diaries)
│   │   ├── sprites.ts  # Wiki image URL builders
│   │   └── format.ts   # GP/time formatting utilities
│   └── App.tsx         # Router with React.lazy + Suspense
├── public/
├── AGENTS.md
└── package.json
```

---

## API Endpoints

| API | URL | Auth | Cache TTL |
|-----|-----|------|-----------|
| Hiscores | `secure.runescape.com/m=hiscore_oldschool/index_lite.json?player=RSN` | None | 10 min |
| Wiki Prices | `prices.runescape.wiki/api/v1/osrs` | `User-Agent` header | 5 min |
| Wiki Mapping | `prices.runescape.wiki/api/v1/osrs/mapping` | `User-Agent` header | 24 hr |
| Wiki Content | `oldschool.runescape.wiki/api.php` (MediaWiki parse) | None | 30 min–1 hr |
| Wise Old Man | `api.wiseoldman.net/v2` | None | 5–30 min |
| OSRS News | `secure.runescape.com/m=news/archive` (HTML scraping) | None | per-session |

---

## Rules

- All OSRS formulas go in `src/lib/formulas/` — single source of truth
- Cache API responses via `src/lib/api/cache.ts` with appropriate TTLs
- Use `import { isTauri } from "../lib/env"` — never redeclare locally
- Use `import { formatGp } from "../lib/format"` — never duplicate
- Wiki image URLs can change — always add `onError` fallbacks on `<img>` tags
- No secrets or API keys needed (all public APIs)
- Wiki content is CC BY-NC-SA 3.0 — attribution required
