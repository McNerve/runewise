# CLAUDE.md — RuneWise

## Overview

OSRS desktop companion app. Tauri (Rust + webview) with React + Vite frontend. Pulls live data from OSRS Wiki Bucket API (monsters, equipment, drops, quests, recipes, spells, money making), Hiscores, and Wise Old Man. 29 views, ~12,000 LOC. v1.1.0.

**RSN:** Raxor

---

## Stack

- **Desktop:** Tauri v2 (Rust backend, system webview)
- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS 4 (dark mode, CSS custom properties)
- **Animation:** motion (page transitions), @radix-ui/react-tooltip (sidebar tooltips)
- **Maps:** Leaflet (interactive world map with wiki tiles)
- **Data:** OSRS Wiki Bucket API (structured JSON), Wiki Prices API, Hiscores API, Wise Old Man API, Star Miners API
- **Build:** GitHub Actions (macOS ARM/Intel + Windows), auto-updater via GitHub releases

---

## Features

### Player
- **Overview** — Player stats with combat/total/XP, hours-to-99 per skill, boss KCs, collection log
- **Collection Log** — Manual tracking with SVG progress rings, 10 categories, ~130 slots
- **XP Tracker** — Wise Old Man integration (gains, achievements, records)

### Tools
- **Skill Calculators** — All 24 skills, 142 training methods with intensity badges, wiki recipe cost calculators (7,176 recipes)
- **DPS Calculator** — 3,172 wiki monsters, 16 modifiers (void/slayer helm/salve/arclight/DHCB/tbow), accuracy bar, breakdown display
- **Gear Compare** — Browse 5,000+ equipment items by slot, sort by any stat, compare up to 3 sets
- **Training Plan** — Input target levels → optimal method sequence with time/cost estimates
- **Production Calculator** — Search any craftable item, see ingredients + costs + profit for bulk runs
- **Dry Calculator** — Drop probability with 68 boss presets
- **Money Making** — 74 curated methods + 623 wiki methods with live GP/hr, intensity badges
- **Farm Timers** — 20 patch types, 7 presets, auto-repeat toggle, native notifications
- **XP Table** — Level 1–99 reference with milestone highlighting

### Bossing
- **Boss Guides** — Wiki content with metadata (difficulty dots, team size, mechanics) for 58 bosses, drop tables with rarity bars + profit calc
- **Raids** — CoX/ToB/ToA room reference with mechanics, tips, loot tables, expected GP calculator
- **Loot** — Wiki bucket drops with shared DropTable component, rarity bars, sorting, GP/kill
- **Combat Tasks** — All 637 combat achievements by tier with section headers

### Market
- **Market** — Unified item search with live GE prices, margins, price charts, high alch values, watchlist, bulk lookup
- **Alch Profits** — High alchemy profit table (tab in Market)
- **Watchlist** — Price tracking with native notifications

### Guides
- **Progress** — Quest tracker (225 wiki quests with items/enemies/ironman), achievement diaries (13 regions), quest unlock predictor ("What Can I Do?")
- **Slayer Helper** — 5 masters with per-master block lists and probability recalculation
- **Clue Helper** — 730 clue scroll entries with solutions
- **Spellbook** — All 224 spells across 4 spellbooks with level, XP, damage, rune costs

### Live
- **World Map** — Interactive Leaflet map with wiki tiles, 1,945+ GeoJSON markers, category filters
- **Shooting Stars** — Star Miners API with world, tier, time remaining, wiki map tile previews
- **OSRS News** — Blog posts with inline reading and status filters
- **Wiki Lookup** — Search and read any wiki page with formatted content

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
│   │   ├── loot/       # Merged drops + boss loot calculator
│   │   ├── progress/   # Merged quests + diaries
│   │   └── ...         # One folder per feature
│   ├── hooks/          # useHiscores, useDebounce, useKeyboardNav
│   ├── lib/
│   │   ├── api/        # API clients + TTL cache (bucket.ts, monsters.ts, equipment.ts, drops.ts, bosses.ts, quests.ts, recipes.ts, spells.ts, moneyMaking.ts)
│   │   ├── wiki/       # Wiki content parsing (helpers.ts, lookup.ts, bossGuide.ts)
│   │   ├── formulas/   # OSRS math (dps.ts with 16 modifiers, xp.ts, combat.ts, dry.ts, trainingPlan.ts, questEligibility.ts)
│   │   ├── data/       # Static fallback data (bosses, quests, slayer, diaries, boss-metadata)
│   │   ├── sprites.ts  # Wiki image URL builders
│   │   └── format.ts   # GP/time formatting utilities
│   └── App.tsx         # Router with React.lazy + Suspense
├── public/
├── CLAUDE.md
└── package.json
```

---

## API Endpoints

| API | URL | Auth | Cache TTL |
|-----|-----|------|-----------|
| Wiki Bucket | `oldschool.runescape.wiki/api.php?action=bucket` | None | 24 hr (localStorage) |
| Wiki Content | `oldschool.runescape.wiki/api.php` (MediaWiki parse) | None | 30 min–1 hr |
| Wiki Prices | `prices.runescape.wiki/api/v1/osrs` | `User-Agent` header | 5 min |
| Wiki Mapping | `prices.runescape.wiki/api/v1/osrs/mapping` | `User-Agent` header | 24 hr |
| Wiki Map Tiles | `maps.runescape.wiki/osrs/versions/{ver}/tiles/rendered/` | None | static |
| Hiscores | `secure.runescape.com/m=hiscore_oldschool/index_lite.json?player=RSN` | None | 10 min |
| Wise Old Man | `api.wiseoldman.net/v2` | None | 5–30 min |
| Star Miners | `public.starminers.site/crowdsource` | API key | 30 sec |
| OSRS News | `secure.runescape.com/m=news/archive` (HTML scraping) | None | per-session |

---

## Rules

- All OSRS formulas go in `src/lib/formulas/` — single source of truth
- Cache API responses via `src/lib/api/cache.ts` with appropriate TTLs
- Use `import { isTauri } from "../lib/env"` — never redeclare locally
- Use `import { formatGp } from "../lib/format"` — never duplicate
- Use `import { WIKI_IMG } from "../lib/sprites"` — never redeclare locally
- Wiki image URLs can change — always add `onError` fallbacks on `<img>` tags
- No secrets or API keys needed (all public APIs)
- Wiki content is CC BY-NC-SA 3.0 — attribution required

## Release Checklist

Before tagging a release, **all three version files must match**:
1. `package.json` → `"version": "X.Y.Z"`
2. `src-tauri/tauri.conf.json` → `"version": "X.Y.Z"`
3. `src-tauri/Cargo.toml` → `version = "X.Y.Z"`

The Tauri auto-updater compares `tauri.conf.json` version against `latest.json` — if the version isn't bumped, users won't see the update. Always bump before tagging, never after.
