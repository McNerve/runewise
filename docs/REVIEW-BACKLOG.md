# Review backlog (2026-07)

Prioritized follow-ups from the full-app review. Shipped on branch
`fix/review-p0-hardening`.

## P0 — Platform / correctness

- [x] Windows RuneLite home-dir (`HOME` → `USERPROFILE` fallback + `PathBuf`)
- [x] Validate persisted navigation against `VALID_VIEWS`
- [x] Align star data-source attribution with 07.gg runtime API
- [ ] Triage `npm audit` high-severity deps before next signed release
- [ ] Re-tag / expand CHANGELOG for 2.x releases (history currently jumps at 1.6.1)

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
- [x] Further split UI shells: MarketDetail, BossActionIcon, shared wiki section classes (shells still large but thinner)
- [ ] Deeper effect/data-hook splits for BossGuide / WikiLookup / useDpsState
- [x] Golden-file DPS fixtures for flagship setups (`dps.golden.test.ts`)
- [ ] UI/integration tests for market flip path + skill calculator edge cases
- [x] Wrap remaining hiscores-heavy views with `ViewErrorBoundary` consistently

## P3 — Growth

- [ ] Short demo clip of one killer flow
- [ ] Community post focused on one problem (not “30+ tools”)
- [ ] Windows SmartScreen / signing notes for installers
