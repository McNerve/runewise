# Changelog

All notable changes to RuneWise are documented here. Versions follow [Semantic Versioning](https://semver.org/).

## [1.4.0] - 2026-04-03

### New Features
- **DPS Calculator overhaul** — 2-column sticky layout, phase-based bosses (12), special attack DPS (17 weapons), spell selection (48 combat spells), ToA/CoX raid scaling, side-by-side loadout comparison
- **Shop Helper** — browse 580+ OSRS shops with 6,234 items, GE price comparison, best deals, currency/members filters, sortable item tables
- **Home dashboard** — player card with account type badge (HC/Iron/UIM/Skiller/Pure/Main), tool grid, watchlist widget, welcome card
- **Slayer reward shop** — 66 rewards across 4 categories with purchase tracking, strategy tab, points per master with streak multipliers
- **Rich item tooltips** — GE price, alch value, examine text, buy limit on hover across 9 components
- **Ironman mode** — auto-detection via hiscores, skill calculator/training plan filter non-ironman methods, market warning banner

### Bug Fixes
- Araxxor drop data corrected (untradeable component IDs replaced with tradeable items)
- Wiki Lookup: canonical title resolution, collapsible sections, lead content truncation
- News scraper: robust selectors, article rendering with details/summary/center tags
- Keybinds: replaced browser-conflicting defaults, added enable/disable toggle

### Performance
- Global item icon cache via GE mapping API (fixes seeds, arrows, bolt tips app-wide)
- Powered staff DPS formulas (Trident, Sang, Shadow)
- Per-view error boundaries with retry
- Sidebar pinned items (right-click, max 5)
- Cross-feature navigation (Slayer to Bosses, DPS to Wiki, Production to Skill Calc)

## [1.3.0] - 2026-04-03

### New Features
- **Boss Guides deep overhaul** — wiki strategy extraction with 30+ section types, OSRS-style equipment grids (paper doll + inventory), interactive wiki tabbers, item tooltips, tile marker copy for RuneLite, boss locations, image lightbox with scroll zoom
- **Spellbook rewrite** — spell icons, color-coded rune cost pills (15 rune colors), expandable rows, 4 spellbook tabs
- **Clue Helper visual polish** — progress dashboard, tier-colored stat cards, bordered clue cards with wiki links
- **XP Tracker** — Wise Old Man integration with error states, bordered tabs, refresh controls

### Bug Fixes
- Lightbox keydown listener leak fixed
- Slayer icon verification across all 90+ monsters (zero fallback letters)
- Boss Guide: Kree'Arra icon fix, Blue Moon wiki page fix, raid variants point to base strategy pages
- Star Helper renamed, moved to Guides family

### Other Changes
- World Map replaced broken Leaflet with zoomable Jagex CDN image + Vite CORS proxy
- OSRS News fixed article CORS, 2-pane layout, preserved links
- Market visual polish — bordered tabs, stat cards, table wrapper, alch profit column, GE mapping icons

## [1.2.0] - 2026-04-02

### Bug Fixes & Data
- 30 bug fixes across all features
- Boss metadata expanded (Nightmare, Phantom Muspah, Duke Sucellus, Leviathan, Vardorvis, Whisperer, Grotesque Guardians)
- Slayer data overhaul — all 5 master task lists verified against April 2026 wiki data (189 tasks)
- Wiki fetcher fallback: tries both `{page}` and `{page}/Strategies`
- StructuredSection fallback: renders raw wiki HTML when parsing fails
- Table CSS cleanup — horizontal separators only, inline images, alternating rows

## [1.1.0] - 2026-04-02

### New Features
- **13 wiki bucket API services** — monsters, equipment, drops, quests, recipes, spells, money making, shops
- **World Map** — interactive Leaflet map with wiki tiles and 1,945+ GeoJSON markers
- **Gear Compare** — browse 5,000+ equipment items by slot, sort by any stat, compare up to 3 sets
- **Raids** — CoX/ToB/ToA room reference with mechanics, tips, loot tables, expected GP calculator
- **Training Plan** — input target levels, get optimal method sequence with time/cost estimates
- **Production Calculator** — search craftable items, see ingredients + costs + profit for bulk runs
- **Collection Log** — manual tracking with SVG progress rings, 10 categories
- **Spellbook** — all 224 spells across 4 spellbooks
- **Kingdom of Miscellania** — worker allocation calculator with live GP pricing
- **Profit Rankings** — boss profit ranking table with curated + wiki drop data
- **Player Compare** — side-by-side stat comparison

### Bug Fixes
- DPS calculator overhaul with loadout presets
- Farm Timers: Overview + Profit tabs
- Construction planner, diary checkboxes, quest rewards, boss requirement checks
- localStorage state fix, CSP fix
- GE volume data integration

## [1.0.0] - 2026-04-02

### New Features
- **4-agent code audit** — 28 findings identified and fixed
- **Visual overhaul** — card UI eliminated, feature-tinted content areas, page transitions
- **Information architecture** — sidebar compacted to 19 items across 6 families
- Merged Drops + Boss Loot into Loot, Quests + Diaries + Combat Tasks into Progress, Watchlist + Alch into Market tabs
- Custom app icon, wiki map tiles, all-view keybinds

## [0.4.0] - 2026-04-01

### New Features
- Complete UI/UX overhaul across 24 features and 60 files
- Dark theme with feature-tinted accent colors
- Consistent card layouts, loading skeletons, empty states
- Global search (Cmd+K) with cross-feature results

## [0.3.0] - 2026-04-01

### New Features
- **DPS Calculator** — full OSRS DPS formula with equipment, prayers, and modifiers
- **Price Charts** — TradingView-style GE price history
- **Global Search** — Cmd+K search across all features
- **Alch Profits** — high alchemy profit table
- **Watchlist** — price tracking with native desktop notifications
- **Farm Timers** — 20 patch types, 7 presets, auto-repeat, native notifications
- **Boss Loot Calculator** — expected GP per kill with curated drop rates
- **Pet Calculator** — drop probability for all skilling/boss pets
- **Money Making** — 74 curated + 623 wiki methods with live GP/hr
- **Combat Tasks** — all 637 combat achievements by tier
- **Clue Helper** — 730 clue scroll entries with solutions
- **Shooting Stars** — Star Miners API integration with world/tier/time data
- **RuneLite Detection** — auto-detect RuneLite installation

### Bug Fixes
- 5-agent code review — all 34 findings fixed (XSS, performance, data accuracy)

## [0.1.5] - 2026-04-01

### New Features
- Navigation context with cross-feature linking
- Skill calculator overhaul with smart defaults and 142 training methods
- OSRS Wiki sidebar sprites replacing emoji icons
- Slayer helper with 5 masters and persistent block list
- Drop tables with live GE prices and rarity bars
- Inline news article reading
- Item detail panel with wiki images
- Boss guide images and stats preview

### Performance
- Route-based code splitting with React.lazy
- Static HTTP client singleton with 15s timeout
- Parallel boss guide fetches with memoization and cache eviction

### Bug Fixes
- External links fixed (open in system browser)
- Hardcoded version replaced with build-time constant
- GE error recovery

## [0.1.4] - 2026-04-01

### Bug Fixes
- Auto-restart app after update install

### Maintenance
- Dependency updates (reqwest, actions/checkout, actions/setup-node)

## [0.1.3] - 2026-04-01

### Bug Fixes
- Platform-correct keybind display (Cmd on macOS, Ctrl on Windows)
- Wider skill calculator grid

### Maintenance
- Issue templates, PR template, Dependabot, README badges

## [0.1.2] - 2026-03-31

### Bug Fixes
- Tauri environment detection fix (`__TAURI_INTERNALS__`)
- Auto-updater with signed releases
- CI build fixes for macOS and Windows

## [0.1.1] - 2026-03-31

### Bug Fixes
- Desktop API failures fixed (root cause: Tauri internals detection)
- Slayer helper data corrections
- Quest tracker fixes
- Auto-updater implementation

## [0.1.0] - 2026-03-31

### Initial Release
- 14 views: skill calculators, combat/dry calculators, GE prices, drop tables, XP tracker (WOM), boss guides, quest tracker, diary tracker, slayer helper, news reader, wiki lookup, settings, overview
- Tauri v2 desktop app with React 19 frontend
- CI builds for macOS (ARM + Intel) and Windows
- OSRS Wiki API integration for live data
