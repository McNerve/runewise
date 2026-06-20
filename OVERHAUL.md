# RuneWise Visual & Product Overhaul — "Gielinor Ledger"

*Strategic plan to take RuneWise from a competent-but-generic 5 to a polished, distinctive 10. Synthesized from a 13-agent deep analysis (codebase map + OSRS-tool landscape research + three judged design directions), 2026-06-19. Complements the correctness work in [`AUDIT-2026-06-10.md`](AUDIT-2026-06-10.md) and builds on the existing design-system seeds from PR #82 (the `Card`/`Button` primitives).*

---

## 1. Honest assessment — a real 5

The bones are good (token system, per-feature accent, DOMPurify'd wiki injection, pure-function combat math, light/dark, and now a `Card`/`Button` primitive from #82). Three things cap it at 5, all fixable without architectural change:

1. **No visual identity.** Content floats on one flat plane; the `Card` primitive still wrapped the translucent `bg-bg-primary/20` pattern; gold diffused into 5–7% ambient washes instead of deployed as an accent.
2. **Bloated catalog.** 27 ungrouped sidebar items over 33 views, family names rendered as invisible dividers; duplicate loot/ranking/recipe/RNG surfaces.
3. **Ignores it's a desktop app.** No offline detection, no window min-size, half the views unguarded by error boundaries.

## 2. What the OSRS landscape says

- **One-click character import is the gold standard** (Wiki DPS "View DPS"). RSN-prefill should be the default entry on every tool. (WikiSync is off-limits per project rule — build on Temple + WOM + hiscores + gear-string paste.)
- **Accuracy is a moat.** "Verifiably wiki-accurate" is positioning, not a feature.
- **"Free, no login, no ads, one native app" is a validated wedge.**
- **Biggest open category: account-aware "what to do next" for *mains*.**
- **Don't fight RuneLite** — RuneWise is the second-screen planning brain.
- **Wire YOUR data together** (KC + drops + gear + prices + gains).

## 3. The visual direction — "Gielinor Ledger"

Warm-obsidian-and-gold: the spatial discipline of Linear, the data grammar of the OSRS Wiki. Three things carry the RuneScape signal — **the official sprites** (the only retained visual, the only saturated colour), **a single rationed gold accent**, and **a Cinzel display face** as an "illuminated capital." Every view renders a *verdict*, not a stat dump.

### Color — 5-step warm luminance ladder (dark-first)

| Token | Dark | Role |
|---|---|---|
| `--color-bg-primary` (surface-0) | `#0B0C10` | app shell / canvas |
| `--color-bg-base` (surface-1) | `#131520` | content base |
| `--color-bg-tertiary` (surface-2) | `#1A1D2A` | canonical card — sits **above** the shell |
| `--color-bg-secondary` (surface-3) | `#232636` | elevated: hover, dropdown, active nav |
| `--color-bg-overlay` (surface-4) | `#2C3042` | tooltip / modal |
| borders subtle/`-border`/strong | `#20232F` / `#2E3345` / `#3D4358` | elevation via hairline borders, not shadows |
| accent / bright / deep | `#D4A574` / `#E8BE86` / `#A87C4E` | gold with range, rationed |
| text primary/secondary/tertiary | `#ECECEF` / `#A4A7B2` / `#6F7382` | three real tiers |
| semantic | `+#34D058` / `−#F2545B` / magic `#5B8DEF` / warn `#E8B339` | desaturated for dark |

Light theme keeps full parity (warm-neutral, no texture; accent `#875F33`, semantics darkened) — **WCAG-verified**: white-on-accent 5.65:1, all semantics clear 3:1 on the canvas. Ambient gold washes retired.

### Type — three faces

- **Display — Cinzel**: wordmark + page titles + section kickers only, never <16px, never on a number.
- **UI — Inter**: medium/semibold.
- **Numeric — JetBrains Mono** (`.num`) with tnum + slashed zero, for *pure-number* displays. Mixed number+word strings keep `tabular-nums` so label words don't render mono.
- `--text-mega` (46px) — the single focal metric per view.
- ✅ **Done:** Cinzel + JetBrains Mono (Variable) + Inter (Variable) self-hosted via @fontsource, trimmed to latin/latin-ext woff2 (~220K bundled, Tauri-offline, no CDN at runtime).

### Components

- **Extended `#82`'s `Card`** (kept the `kicker`/`action` API; added `elevation` = `flat | raised | overlay | hero` and the real raised surface) — upgrades all existing usages in place.
- **`StatCard`** → raised surface + mono tabular value.
- **Mega metric + verdict** on the DPS result.

## 4. Consolidate — 27 items → ~5 hubs (later phase)

Render family names as headers; collapse into Player · Combat · Market · Plan · Live; merge GE/loot/recipe/RNG duplicates; ⌘K palette as an augment.

## 5. New & improved features (by leverage)

RSN one-click prefill everywhere · BiS / next-upgrade recommender · "what to do next" engine for mains · GE Flip Finder (tax-correct, buy-limit-aware) · robustness floor (offline banner, window min-size, error boundaries).

## 6. Roadmap

- **This PR — Foundation**: surface ladder + extended `Card` + `StatCard` + DPS verdict + app-wide token/numeric sweep + Cinzel titles + WCAG-fixed light theme. No behaviour change.
- ✅ **Fonts & sidebar identity** (shipped): self-host the three faces; render sidebar family headers (the 27-item wall is now scannable groups). Next within this lane: verdict badges + infobox grammar app-wide.
- **Then — IA consolidation**: grouped hubs, merge duplicates, ⌘K augment, robustness floor.
- **Then — Differentiators**: RSN prefill, BiS recommender, Flip Finder, "what next" engine.

### Migration discipline

Ship in order so the app is never half-migrated. Every new token has a `.light-theme` pair. The inverted `--color-bg-*` names are kept (re-pointed hexes); their surface-N role is documented in the `@theme` comments (Tailwind v4 won't emit `var()`-referencing alias tokens, so no separate `--surface-*` layer). Never touch the equipment/inventory paper-doll positioning CSS — only swap its hardcoded browns for tokens.
