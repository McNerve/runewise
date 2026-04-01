# Contributing

Thanks for your interest in RuneWise! Here's how to get started.

## Development Setup

```bash
# Prerequisites: Node.js 22+, Rust toolchain
git clone https://github.com/McNerve/runewise.git
cd runewise
npm install

# Run in browser (Vite dev server)
npm run dev

# Run as desktop app (Tauri)
npm run tauri dev
```

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
