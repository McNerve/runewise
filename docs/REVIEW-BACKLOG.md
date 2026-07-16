# Review backlog (2026-07)

Prioritized follow-ups from the full-app review. P0 items in this list that are
checked were shipped on branch `fix/review-p0-hardening`.

## P0 — Platform / correctness

- [x] Windows RuneLite home-dir (`HOME` → `USERPROFILE` fallback + `PathBuf`)
- [x] Validate persisted navigation against `VALID_VIEWS`
- [x] Align star data-source attribution with 07.gg runtime API
- [ ] Triage `npm audit` high-severity deps before next signed release
- [ ] Re-tag / expand CHANGELOG for 2.x releases (history currently jumps at 1.6.1)

## P1 — Product focus

- [ ] IA consolidation: fewer sidebar leaves, hub-first navigation (see `OVERHAUL.md`)
- [ ] Pick one marketing hero: Upgrade Finder **or** Flip Finder **or** “what next”
- [ ] RSN / hiscores prefill as default entry on every calculator
- [ ] Always-visible GE / hiscores staleness on money-critical screens
- [ ] Offline banner + window min-size (desktop polish)

## P2 — Maintainability

- [ ] Split `BossGuide.tsx`, `useDpsState.ts`, `WikiLookup.tsx`, `Market.tsx`
- [ ] Golden-file DPS fixtures vs wiki calculator for flagship setups
- [ ] UI/integration tests for market flip path + skill calculator edge cases
- [ ] Wrap remaining hiscores-heavy views with `ViewErrorBoundary` consistently

## P3 — Growth

- [ ] Short demo clip of one killer flow
- [ ] Community post focused on one problem (not “30+ tools”)
- [ ] Windows SmartScreen / signing notes for installers
