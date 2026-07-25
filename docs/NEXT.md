# NEXT — living product backlog

After the e2e wiki-parity + reliability + CI lint pass on `feat/e2e-improve`.

## Shipped on this branch

- Wiki-aligned DPS core + spot-check fixes (fang accuracy, magic +9, tbow, void, shadow, …)
- Bolt **PMF** mixture (`boltDist.ts`) + EV parity
- Monster attributes table; expanded specs
- GE context unification for farm profit, profit rankings, boss profit ranking
- Reliability UX (skill/kingdom/alch/farm/production/prefill)
- Windows SmartScreen notes (`docs/WINDOWS-SIGNING.md`)
- Wiki golden + spot-check fixtures

## Still open (optional follow-ups)

### Combat

- Remaining obscure specs (burning claws full matrix, ballista, true MSB ammo table)
- Kandarin diary bolt proc rate variants
- Live wiki/bucket **monster size/attributes** API when fields exist

### Product

- Deeper gear-string paste / one-click import everywhere
- Account-aware “what to do next”
- Upgrade finder as default hero path on home

### Growth

- Short demo clip + community post
- Authenticode signing in CI (see WINDOWS-SIGNING.md)

## Ownership

- Formula goldens: `dps.wiki-fixtures.test.ts`, `dps.wiki-spotcheck.test.ts`
- Monster meta: `src/lib/data/monster-attributes.ts`
