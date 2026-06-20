# RuneWise Visual & Product Overhaul — "Gielinor Ledger"

*Strategic plan to take RuneWise from a competent-but-generic 5 to a polished, distinctive 10. Synthesized from a 13-agent deep analysis (codebase map + OSRS-tool landscape research + three judged design directions), 2026-06-19. Complements — does not replace — the correctness work in [`AUDIT-2026-06-10.md`](AUDIT-2026-06-10.md).*

---

## 1. Honest assessment — a real 5

The bones are good (token system, per-feature accent, DOMPurify'd wiki injection, pure-function combat math, light/dark). Three things cap it at 5, all fixable without architectural change:

1. **No visual identity.** `.panel-hero` / `.panel-surface` were *empty CSS comments*; content floated on one flat plane with near-invisible borders; three divergent card styles drifted across 35 files; gold diffused into 5–7% ambient washes instead of deployed as an accent.
2. **Bloated catalog.** 27 ungrouped sidebar items over 33 views, family names rendered as invisible dividers; duplicate loot/ranking/recipe/RNG surfaces; three dead feature dirs (`boss-loot`, `drops`, `raid-companion`).
3. **Ignores it's a desktop app.** No offline detection, no window min-size, half the views unguarded by error boundaries, onboarding RSN validation broken in the shipped build.

## 2. What the OSRS landscape says

- **One-click character import is the gold standard** (Wiki DPS "View DPS"). RSN-prefill should be the default entry on every tool. (WikiSync is off-limits per project rule — build on Temple + WOM + hiscores + gear-string paste.)
- **Accuracy is a moat.** Players distrust drifting calculators. "Verifiably wiki-accurate" is positioning, not a feature.
- **"Free, no login, no ads, one native app" is a validated wedge** (GeMargin/OSRS Exchange beating GE-Tracker on exactly this).
- **Biggest open category: account-aware "what to do next" for *mains*.** ironman.guide owns it for irons; nobody does mains.
- **Don't fight RuneLite** — it owns the in-game overlay. RuneWise is the second-screen planning brain.
- **Wire YOUR data together** (KC + drops + gear + prices + gains) — the one thing single-purpose competitors structurally can't do.

## 3. The visual direction — "Gielinor Ledger"

Warm-obsidian-and-gold: the spatial discipline of Linear, the data grammar of the OSRS Wiki. Three things carry 100% of the RuneScape signal — **the official sprites** (the only retained visual and the only saturated color on screen), **a single rationed gold accent**, and **a Cinzel display face** used surgically as an "illuminated capital." Every view renders a *verdict*, not a stat dump.

### Color — 5-step warm luminance ladder (dark-first)

| Token | Dark | Role |
|---|---|---|
| `--color-bg-primary` (surface-0) | `#0B0C10` | app shell / canvas (darkest) |
| `--color-bg-base` (surface-1) | `#131520` | content base |
| `--color-bg-tertiary` (surface-2) | `#1A1D2A` | canonical card — sits **above** the shell |
| `--color-bg-secondary` (surface-3) | `#232636` | elevated: hover, dropdown, active nav |
| `--color-bg-overlay` (surface-4) | `#2C3042` | tooltip / modal over scrim |
| `--color-border-subtle / -border / -border-strong` | `#20232F` / `#2E3345` / `#3D4358` | elevation via hairline borders, not shadows |
| `--color-accent / -bright / -deep` | `#D4A574` / `#E8BE86` / `#A87C4E` | gold with range, rationed |
| `--color-text-primary / -secondary / -tertiary` | `#ECECEF` / `#A4A7B2` / `#6F7382` | three real tiers (tertiary is a token, not `/40` opacity) |
| semantic (OSRS contract) | `+#34D058` / `−#F2545B` / magic `#5B8DEF` / warn `#E8B339` | desaturated ~8% so they don't bloom on dark |

Light theme keeps full parity (warm-neutral, no texture; accent darkened to `#9A6F3E` to fix the WCAG fail at the old `index.css:40-43`). Ambient gold washes retired — depth comes from the ladder, not glow.

### Type — three faces, each one job

- **Display — Cinzel** (not Decorative): wordmark + page titles (≥24px) + uppercase section kickers **only**. Never <16px, never on a number, never interactive.
- **UI — Inter**: medium/semibold (thin fades on dark).
- **Numeric — JetBrains Mono** with `tnum` + slashed zero, for *every* meaningful number (GP, DPS, KC, prices, deltas). Numbers are half the content.
- New `--text-mega` (46px) — the single focal metric per view.
- *Follow-up:* self-host Cinzel + JetBrains Mono + Inter as subset woff2 (Tauri offline; no CDN at runtime). Today the tokens fall back to system mono/serif, which already reads markedly better.

### Components — one grammar

- **One `<Card>` primitive** (`flat | raised | overlay | hero`) — the home for the behavioural surface variants (hero gold border, overlay shadow, hover lift). *v2.7 adoption is deliberately incremental:* the anti-drift win is that all surfaces now share the same **tokens** (`border-border-subtle` / `bg-bg-tertiary`), so a token change is one CSS edit, not an N-file sweep; routing the ~29 token-cards through `<Card>` (to unlock the v2.8 hover/count-up behaviours) is a v2.8 follow-up, not a foundation-PR refactor.
- **One `StatCard`** — raised surface, mono tabular value, tertiary kicker, optional accent rail / sprite / delta badge. Legacy `components/StatCard.tsx` deleted.
- **Infobox-DNA** (sprite header + value rows) reused across bosses/items/loadouts/drops.
- **Mega metric + verdict badge** — one commanding mono number per view with an op.gg-style tier/delta chip.
- **Verdict / delta badges**, op.gg comparison rows, intentional sprite-led empty states (no dashed ghost rows).

### Motion — functional only

Border-over-shadow hover lift, count-up on the focal metric (debounced to settle-on-idle; snaps under `prefers-reduced-motion`), Steam-style card-hover-to-detail. No idle animation.

## 4. Consolidate — 27 items → ~5 hubs

- Render family names as section headers (data already exists — one-line change).
- Collapse into ~5 grouped, collapsible hubs: **Player · Combat · Market · Plan · Live**.
- Merge duplicates: Flip Journal + Watchlist + Alch → one **Grand Exchange** hub; Loot "Boss Rankings" = Money Making ProfitRankings (pick one); two recipe engines → one; Dry + Pet → one "Drop Chance" calc; promote the hidden `Progress` hub.
- Delete dead dirs: `boss-loot`, `drops`, `raid-companion` (zero references).
- ⌘K palette as an **augment** to the sidebar (not a replacement), wired to the existing `runewise:open-search` bus.

Result: ~12 meaningful sidebar entries, zero loss of functionality.

## 5. New & improved features (by leverage)

1. **RSN one-click prefill everywhere** + gear-string paste path.
2. **BiS / next-upgrade recommender** — generate the optimal loadout from stats+budget+owned items.
3. **"What to do next" engine for mains** — the unclaimed category.
4. **GE Flip Finder** — tax-correct net (2%, 5M cap), buy-limit-aware "profit per 4h cycle," staleness warnings.
5. **Robustness floor** — offline banner, window min-size, `ViewErrorBoundary` on the 13 unguarded views, one welcome surface, Market data strip.

## 6. Roadmap (rides alongside the correctness milestones in AUDIT-2026-06-10.md)

- **v2.7 — Foundation** *(this branch)*: surface ladder + one `<Card>` + token system + StatCard consolidation + DPS hero metric + delete dead dirs. *(5 → 6.5, no behavior change.)*
- **v2.8 — Hierarchy & type**: bundle the three fonts; mega-metric + verdict badges app-wide; infobox card grammar. *(→ 8.)*
- **v2.9 — IA consolidation**: grouped hubs, merge duplicates, ⌘K augment, robustness floor. *(→ 8.5.)*
- **v3.0 — Differentiators**: RSN prefill everywhere, BiS recommender, Flip Finder, "what next" engine. *(→ 10.)*

### Migration discipline

Ship in the order above so the app is never half-migrated. Every new token has a `.light-theme` pair. Keep the inverted `--color-bg-*` names (re-point hexes) to avoid rename churn; new `--surface-*` aliases are the canonical names going forward. Never touch the equipment/inventory paper-doll positioning CSS — only swap its hardcoded browns for tokens, and visual-diff before shipping.
