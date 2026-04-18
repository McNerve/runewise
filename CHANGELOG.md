# Changelog

All notable changes to RuneWise are documented here. Versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Page-by-page audit follow-ups

Post-v1.6 sweep across all 40 views in 9 families. See `.claude/v16-audit.md`.

### Fixes

- **Skill Calculator no longer crashes** when target level exceeds current capacity. Root cause: wiki recipe JSON sometimes returned `materials`/`output` as objects not arrays; `Array.isArray()` guard added at the data-source boundary (`src/lib/api/recipes.ts`) plus defensive `?? []` in the recipe table.
- **Arceuus, Ancient, and Lunar spells** now correctly show P2P. Wiki data occasionally flagged individual spells as F2P despite the spellbook being members-only — hard-gated by spellbook type.
- **Alch profit display for capped items** no longer shows `-2,147,450,647`. Items at the GE cap (≥2.147B gp) are filtered from the alch rankings and browse-all view.
- **Collection Log "Recently Obtained"** now uses real item icons with a proper fallback chain (wiki image → itemIcon → letter placeholder) instead of letter tiles.
- **Collection Log boss-row drill-in** scrolls the items panel into view on category click.
- **ErrorBoundary copy** no longer references "V5" — generic reload message.
- **Settings keybind slots** no longer display empty `⌘` labels for actions without a default bind; labels are filtered to only bound actions.

### Consistency + primitives

- New shared UI primitives under `src/components/primitives/`:
  - `Tabs` — keyboard-navigable underline tab strip with optional icons + count badges.
  - `FilterPills` — horizontal pill row matching Clue Helper / OSRS convention.
  - `StatGrid` + `StatCard` — unified stat tile layout (white value, muted label, one optional accent). Replaces the per-page rainbow tile pattern.
  - `TierBadge` + `TIER_COLORS` — canonical OSRS tier palette (Beginner gray / Easy green / Medium yellow / Hard red / Elite purple / Master orange).
- Migrated Home, Profile, DPS Calc, Combat Tasks, Money Making, Items/Market, Clue Helper to the primitives. Net −170 LOC.

### Dedupe + surfaces

- **Profile** no longer embeds Quests/Diaries/Combat Tasks tabs. Single deep-link CTA to the canonical `#progress` page. Progress remains the only home for those surfaces (plus its unique "What Can I Do?" tab).
- **Alch Profits** is now sole-sourced from Items & Watchlist. Money Making links through instead of duplicating.
- **Profit Rankings** tab in Money Making is canonical. The standalone `#profit-hub` page has been folded in; `#profit-hub` silently redirects to `#money-making?tab=rankings` via `LEGACY_ALIASES`.
- Deleted unreachable features: `src/features/runelite/` and `src/features/price-charts/` (no registry entries, no imports).

### Navigation + tables

- **Boss Guides** action row collapsed into 3 trailing icon buttons (Profit Calculator / DPS / Open Wiki, plus Raid Rooms on raids). Kills the "Loot Calculator" vs "Loot & Drops" ambiguity.
- **Sticky table headers** (`thead.sticky-thead` helper in `index.css`) on 8 long tables: Boss Guides loot, Market Browse All, Loot profit calc + boss rankings, Gear Compare weapons.
- **OSRS News tabs** slimmed from a 2×2 oversized grid to a horizontal pill row matching Money Making.

### About

- Added TempleOSRS and Star Miners to the Data Sources list.

### Visual foundation

- **Accent shift to rune/magic gold** (`#d4a574`). Replaces Tailwind blue-500 as the primary accent across nav, focus rings, active tabs, stat emphasis. Blue moves to `--color-info` for links and utility states; success/danger/warning unchanged.
- **Feature accent system collapsed** from ~38 distinct hues in `src/lib/featureAccent.ts` to one accent family with three strengths (STRONG / MID / SOFT). Headline destinations use STRONG, mid-tier tools MID, meta/settings SOFT. The Clue Helper tier palette remains the one intentional exception.
- **Surface hierarchy swap**. Cards/panels default to `bg-tertiary`. `bg-secondary` is reserved for elevated surfaces (active nav, tooltips, hover states). Makes panels feel grounded instead of ghostly.
- **Type scale** added to Tailwind v4 `@theme` in `src/index.css`: `text-kicker/label/ui/base/h4/h3/hero`. Migrated headline sizing on Home, Profile, DPS Calc, Star Helper, Boss Guides, Market, Money Making.

### OSRS-inspired iconography

- Entire sidebar redesigned with custom OSRS-authentic SVG silhouettes replacing generic 2-stroke line icons. 30+ distinct glyphs including Lumbridge keep (Home), Slayer helmet (Slayer Helper), crossed scimitars (DPS Calc), skill cape (Skill Calc), rune tablet (Spells), clue scroll (Clue Helper), shooting star (Stars), GE booth (Market), farming seedlings (Timers), boss skull (Boss Guides), raid pillars (Raids), checkmark list (Progress). Every glyph is `currentColor`-based so the feature accent still tints them.
- Fixed swapped `NAV_ICONS` entries in `src/lib/sprites.ts`: Slayer and Bosses were pointing to each other's icons.

### Data coverage

- **Combat Tasks** now attempts to load the full 637-task set from the OSRS Wiki `combat_achievement` bucket via `fetchAllCombatTasks()` in `src/lib/api/combatTasks.ts` (24h cache, IndexedDB persistence). Wiki data is merged with the hardcoded subset so boss-workspace links are preserved. Falls back gracefully to the curated sample with a visible "wiki unavailable" warning when the query fails or returns empty.
- **Boss Rankings** now shows all 69 tracked bosses instead of only the 31 with curated drop data. Bosses without drop-table data render with em-dash placeholders and are pinned below those with GP/hr data.
- **Alch Profits 200-item hard cap removed** — now paginated at 50/page with prev/next controls and "Page N of M" indicator. Filter/sort changes reset to page 1.

### Polish

- **Tab warm-switch bug** fixed across Money Making, Profile, Progress, Loot, Market, Skill Calc. Previously the `params.tab` was only read on mount — hash-based redirects like `#profit-hub` → `#money-making?tab=rankings` wouldn't switch the active tab if the component was already rendered. Added `useEffect` sync hooks everywhere the pattern occurred.
- **Tier palette propagation** — canonical OSRS palette (Easy green / Medium yellow / Hard red / Elite purple / Master orange / Grandmaster amber) now applies consistently in Combat Tasks, Quest Tracker, Diary Tracker. Clue Helper already had it; the rest caught up.
- **Empty-state warmth**: Home now always renders the "Recent" section with a hint when empty. Hiscores Lookup shows recent player chips. Wiki shows recent article chips. Recipe Calculator surfaces 10 popular recipes (Shark, Saradomin brew, Super combat potion, Rune platebody, Ranarr, Magic logs, Yew longbow, Dragonstone, Prayer potion, Anglerfish) before search.
- **Collection Log drill-in** — category clicks now scroll the items panel into view on narrow viewports.

## [1.6.0] - 2026-04-17

### Pet Calculator — full redesign

- **Level-scaled skilling formula** — implements wiki's `1 / (B − 25 × Level)` per-action rate with L99 cap and 15× bonus at 200M XP. Previously used flat rate so L70 and L99 looked identical. Skill level auto-fills from hiscores.
- **Boss scaling modifiers** — Olmlet (CoX points slider), Lil' zik (Normal/HM toggle), Tumeken's guardian (invocation/raid level), Little nightmare (team size + Phosani toggle), Dom (delve select), and Slayer-task boosts for Jal-nib-rek / Tzrek-jad / Yami.
- **Variant toggles** for wilderness-lite and alt-boss variants: Artio, Calvar'ion, Spindel, Chaos Fanatic, normal Gauntlet. Header source updates live when toggled.
- **Method comparison table** replaces the old dropdown — each row shows effective rate, actions-to-50%, and time estimate (when XP/hr entered). Sorted fastest-first with ★ marker and an explicit "Fastest at L{X} — click to use" callout.
- **Hiscores auto-fill** — XP for skilling pets (derives actions via `xpPerAction`), KC for boss pets (bidirectional activity name match), token-match for action-only pets like Smolcano → Zalcano KC.
- **Owned-pet tracking** — Temple OSRS collection log sync for synced accounts (auto-highlights owned pets green with ✓ badge), plus manual localStorage toggle for everyone else. "Owned: X / 68" counter in header.
- **Search + hide-owned filter** for the 68-pet grid.
- **Context-aware unit labels** per pet: Kill Count, Completions, Caskets Opened, Games Completed, Catches, Rumours Completed, Wave 10 Completions, Runs Completed, Subdues. Per-action unit override lets Hespori and Zalcano (bosses inside skill pets) show "Kill Count".
- **"Not tracked on hiscores" hint** for pets whose source isn't in the hiscores API (Herbi, Quetzin, Chompy chick, BA, Soul Wars, GoTR, etc.).

### Pet Calculator — data fixes

- 45 → 52 boss pets, 10 → 12 skill pets after wiki audit. Added: Bran (Royal Titans), Beef (Brutus), Dom (Doom of Mokhaiotl), Gull (Shellbane Gryphon), Moxi (Amoxliatl, renamed from "Lil' Amoxliatl"), Yami (Yama), Quetzin (Hunter rumours), Soup (Sailing), Abyssal protector (GoTR), Chompy chick, Pet penance queen.
- Rate corrections: Huberte 3000 → 400, Wisp 2500 → 2000, Butch 2500 → 3000, Muphin 2560 → 2500, Scorpia 2000 → 2016, Callisto/Vet'ion/Venenatis 2000 → 1500 (wilderness-lite variant rates noted).
- Renames to wiki-canonical: "Pet chaos elemental", "Pet dark core", "Ikkle hydra", "Lil' zik", "Tumeken's guardian", "Tzrek-jad".
- Removed fake entries: "Moons pet (Jal-MejJak)" (no such pet), "Parasitic egg" (metamorphosis item), duplicate Muphin entry under "Midnight".
- SKILL_PETS B-constants audited across all 11 skilling pets. Notable fixes: Beaver Yew 72k → 145k, Teak 108k → 264k; Baby chinchompa Red 131k → 98k, Black 131k → 82k; Tangleroot Hespori 65 → 65 (was flat 65 not level-scaled); Rift guardian rune rates.
- **Phoenix (Wintertodt) and Tangleroot (Hespori)** math bugs — both were using XP-per-action conversion for per-event rolls. Now action-only so hiscore activity match populates correctly.
- **Tangleroot "Farm run (mixed)"** new entry replacing per-crop dropdown — nobody farms only Magic trees; aggregate rate (1/850 at L99) matches real mixed-run play. Hespori kept as separate method.
- **Ikkle hydra icon fix** — data audit rename broke the wiki URL; restored to `Ikkle_Hydra_(serpentine).png`.

### Dry Calculator — polish

- Removed all pet entries (belong in Pet Calculator only).
- Fixed Butch / Baron boss mappings (were swapped — now Duke Sucellus → Baron, Vardorvis → Butch).
- Auto-pull KC from hiscores when a boss preset is selected (bidirectional activity name match).

### Tests

- 133 → 162 tests (+29). New coverage: `skillingPetRate` across L1/50/70/99/200M, pet modifier rate registry (Olmlet, ToA, Nightmare, Dom, slayer tasks).

### Infrastructure

- `.claude/settings.local.json` pre-approves `mcp__Claude_Preview__*` tools so team agents don't hang on permission dialogs.

## [1.4.1] - 2026-04-03

### Security
- Fixed `useAsyncData` retry not resetting loading/error state
- Removed `style` from DOMPurify allowed attributes (CSS injection vector)
- Replaced `innerHTML` with DOM APIs for tile marker buttons
- Added URL protocol validation to `openExternal` (blocks non-HTTP schemes)
- Hardened CSP: explicit `script-src`, `frame-src 'none'`, `object-src 'none'`
- Enforced HTTPS-only in Rust proxy
- Added `res.ok` checks to wiki, news, and shop API calls

### Bug Fixes
- Switched Shooting Stars from Star Miners API (key revoked) to 07.gg public endpoint
- Fixed World Map not loading in Tauri (missing `cdn.runescape.com` in CSP `img-src`)
- Fixed Bulk Lookup showing all items as "Not found" (mapping only loaded on Browse tab)
- Fixed XP Tracker header text overlapping with refresh controls
- Fixed `fetchShopImage` using raw `fetch` instead of `apiFetch` (broken in Tauri)
- Fixed News article race condition on rapid clicks (request ID tracking)

### Performance
- Added `React.memo` to 5 hot components (MonsterSearch, ModifierToggles, DpsBreakdown, DropTable, ItemTooltip)
- DPS Calculator lazy-loads monsters on first search (was eagerly fetching 3K+ items on mount)
- Home dashboard uses static watchlist snapshot instead of 60-second polling
- Equipment deduplication cached (was running O(5000) on every search keystroke)
- ItemTooltip prices refresh via TTL cache instead of stale module-level variable
- Expired cache entries now cleaned from localStorage
- FarmTimers skip ticks when tab is hidden
- Browser fetch timeout (20s) for dev mode
- Single retry with 1s delay for transient API errors (429/5xx)
- Parallel ironman detection (3x RTT reduced to 1x)
- Deferred icon cache initialization to after first render

### Tests
- Added 97 new tests across 7 files (36 → 133 total)
- Covers: combat level, XP table, dry/pet calculators, formatGp, timeAgo, quest eligibility, hiscores validator

### Maintenance
- Removed 16 tracked files from repo (worktree refs, boilerplate, dead code, 1.2MB source icon)
- Rewrote `.gitignore` comprehensively
- Added `CHANGELOG.md` with full version history
- Updated all 13 GitHub release notes
- Dependabot commits no longer use scopes
- Release note categories expanded (Features, Bugs, Performance, Maintenance)
- Vitest excludes `.claude/` directory (tests no longer run twice)
- 65+ star location key mappings for 07.gg API
- 4 missing wiki map tile entries added

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
