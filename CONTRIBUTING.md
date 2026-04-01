# Contributing

Thanks for your interest in RuneWise! Here's how to get started.

## Development Setup

```bash
# Prerequisites: Node.js 22+, Rust toolchain (https://rustup.rs)
git clone https://github.com/McNerve/runewise.git
cd runewise
npm install

# Run in browser (hot reload, Vite dev server)
npm run dev

# Run as desktop app (Tauri webview)
npm run tauri dev
```

**Browser mode** uses Vite proxy rewrites for API calls — no Rust needed. Great for frontend work.

**Tauri mode** compiles the Rust backend and runs the native app. Needed for testing desktop features (updater, native proxy, window behavior).

## Architecture

```
src/
├── features/       # One folder per view (self-contained)
├── components/     # Shared UI (Sidebar, PlayerBar, Skeleton)
├── hooks/          # Custom React hooks (useHiscores, useDebounce)
├── lib/
│   ├── api/        # API clients + cache layer
│   ├── formulas/   # OSRS math (XP, combat, drop probability)
│   └── data/       # Static game data (bosses, quests, slayer tasks)
src-tauri/          # Rust backend (HTTP proxy, Tauri plugins)
```

Each feature in `src/features/` is lazy-loaded via `React.lazy()` in `App.tsx`. API responses are cached in-memory with configurable TTLs (see `src/lib/api/cache.ts`).

## Workflow

1. Fork the repo and create a branch (`feat/`, `fix/`, `refactor/`)
2. Make your changes
3. Run `npx tsc --noEmit && npm run lint` to verify
4. Open a PR against `main`
5. CI must pass before merge

## Guidelines

- Follow existing code patterns and naming conventions
- OSRS formulas go in `src/lib/formulas/` — single source of truth
- API clients go in `src/lib/api/` with caching via `cache.ts`
- Each feature is self-contained under `src/features/`
- No secrets or API keys — all APIs are public
- Wiki image URLs can change — always add `onError` fallbacks on `<img>` tags

## First Contribution Ideas

Check out [open issues](https://github.com/McNerve/runewise/issues) or look for `good first issue` labels. Feature requests and bug reports are also welcome — use the issue templates.
