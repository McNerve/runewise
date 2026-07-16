# Review backlog (2026-07)

Prioritized follow-ups from the full-app review. Shipped on branch
`fix/review-p0-hardening`.

## P0 — Platform / correctness

- [x] Windows RuneLite home-dir (`HOME` → `USERPROFILE` fallback + `PathBuf`)
- [x] Validate persisted navigation against `VALID_VIEWS`
- [x] Align star data-source attribution with 07.gg runtime API
- [x] Triage `npm audit` high-severity deps (cleared to 0 in 2.5.3 hardening)
- [x] Promote 2.5.3 changelog section (full 2.x history still incomplete)
- [x] Release workflow_dispatch tag safety (`RELEASE_TAG`, prune guard)

## P1 — Product focus

- [x] Sidebar IA trim (secondary tools → search/deep-link only)
- [x] Flip Finder hero strip (Best / limit, top margin, median ROI)
- [x] Upgrade Finder hero (top DPS + best value picks)
- [x] RSN / hiscores prefill banners on major calcs (player bar remains single entry)
- [x] Always-visible GE / hiscores staleness on money-critical screens (Market + Money Making)
- [x] Offline banner + window min-size (desktop polish)

## P2 — Maintainability

- [x] Extract BossGuide pure helpers (`bossGuideUtils.ts`) + constants
- [x] Extract DPS types + gear math from `useDpsState` (`dpsTypes.ts`, `dpsGearMath.ts`)
- [x] Further split UI shells: MarketDetail, BossActionIcon, shared wiki section classes
- [x] Boss guide pure selectors + wiki GE pure helpers (effects still in components)
- [ ] Optional: full `useBossGuideData` / `useWikiDocument` hooks for remaining effects
- [x] Golden-file DPS fixtures for flagship setups (`dps.golden.test.ts`)
- [x] Flip Finder hero path integration-style tests
- [x] Skill calculator edge-case tests (`skillCalcUtils`)
- [x] Wrap remaining hiscores-heavy views with `ViewErrorBoundary` consistently

## P3 — Growth

- [ ] Short demo clip of one killer flow
- [ ] Community post focused on one problem (not “30+ tools”)
- [ ] Windows SmartScreen / signing notes for installers
