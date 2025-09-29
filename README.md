# Expense Tracker (Desktop, EUR, English)

[![CI](https://github.com/your-org/simple-ledger/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/simple-ledger/actions/workflows/ci.yml)

Manual expense logging with monthly category budgets and clear charts. Local-first (IndexedDB), no accounts.

## Features (MVP)
- Log: amount, date, category, note
- Budgets: per category per month, carry-over toggle
- Reports: Budget vs Actual, Spend by Category, Trend Over Time
- Export/Import JSON backups

## Quick start
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Visit http://localhost:5173

### Running inside a sandbox

When the development environment runs inside a sandbox or remote container, expose the Vite server so it can be reached from your host machine:

1. Install dependencies: `npm install`
2. Start the server with an explicit host (and optional custom port if required by your sandbox): `npm run dev -- --host 0.0.0.0 [--port 5173]`
3. Open the forwarded URL from your browser (for example, `http://127.0.0.1:5173` if the sandbox forwards the default port).

> **Note:** Package downloads require internet access. In restricted environments use a local npm mirror or a pre-populated cache (`npm install --prefer-offline`).

## Available scripts
- `npm run dev` — start the Vite development server
- `npm run build` — type-check and create the production build
- `npm run preview` — serve the production build locally
- `npm run lint` — run ESLint against TypeScript/React sources
- `npm run test` — execute unit tests in watch mode with Vitest

## Continuous integration

The GitHub Actions workflow defined in `.github/workflows/ci.yml` installs dependencies with `pnpm`, runs the lint checks, and executes the Vitest suite (`pnpm test --runInBand`) for every push and pull request targeting `main`.

## Tech stack
- React 18 + TypeScript
- Vite 5 build tooling
- Dexie for IndexedDB data storage
- Zod, date-fns, Chart.js, @tanstack/react-table, @paralleldrive/cuid2

## Project structure
```
src/
  app/            # Application shell, navigation
  components/     # Shared UI primitives (Layout, TabNavigation)
  db/             # Dexie database configuration and seeds
  domain/         # Zod schemas and domain helpers
  pages/          # Feature surfaces: Log, Budgets, Reports, Settings
  services/       # Data-access layer for expenses, budgets, categories, backups
  styles/         # Global design tokens and base theme
  test/           # Vitest setup utilities
  utils/          # Formatting helpers and shared hooks
```

Additional directories of note:
- `src/db` for the Dexie schema and database helpers
- `src/services` for domain services
- `src/utils` for shared utility functions and React hooks

## Current limitations
- Tab content is placeholder-only; Stage 3 will add the real forms, tables, and dashboards referenced in each page description.

## Contributing
See `CONTRIBUTING.md`. Code of Conduct: `CODE_OF_CONDUCT.md`.

## License
See `LICENSE`.
