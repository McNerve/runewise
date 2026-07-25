# NEXT — living product backlog

Short opportunities after the e2e wiki-parity + reliability pass on `feat/e2e-improve`.
Not a commitment; reorder freely.

## Done recently (this branch)

- Wiki-aligned DPS core (void levels, tbowScaling, melee trunc pipeline, fang/scythe, Shadow, bolts/ZCB, …)
- Curated `monster-attributes` (size, Xerician, demonbane vuln, tags)
- Flagship golden fixtures in `src/lib/formulas/dps.wiki-fixtures.test.ts`
- Expanded spec EV models (voidwaker, dark bow, fang spec, webweaver, claws)
- GE/hiscores fail UX (skill calc, kingdom, alch, farm profit, production, prefill clear)

## Still open

### Combat accuracy

- More HitDist specs: burning claws, AGS multi-path, ballista,MSB true ammo-only with equipped ammo str table
- Bolt PMF (not only EV blend); Kandarin diary bolt proc rates
- Pull size/attributes from wiki/bucket API when available; keep curated table as fallback
- Optional: external golden vectors scraped/approved from wiki calc for CI

### Data / platform

- Unify remaining local GE fetchers (ProfitRankings, BossProfitRanking) onto `useGEData`
- `useBossGuideData` / `useWikiDocument` hooks (see `docs/REVIEW-BACKLOG.md`)
- Powered-staff max-hit auto from weapon name without spell picker

### Product differentiators

- Deeper RSN → all-tools prefill + gear-string paste
- “What to do next” for mains
- Upgrade finder with live GE + wiki-accurate DPS as default path

### Growth

- One short demo clip (RSN → DPS vs boss → upgrade finder)
- Community post focused on a single problem
- Windows SmartScreen / code-signing notes for installers

## Ownership notes

- **Formula goldens**: `src/lib/formulas/dps.wiki-fixtures.test.ts` + `dps.golden.test.ts` — update only with intentional formula changes and a commit note citing wiki behaviour.
- **Monster meta**: `src/lib/data/monster-attributes.ts` — longest substring match; prefer longer keys for specificity.
