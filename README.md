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

> **Note:** Package downloads require internet access. In restricted environments use a local npm mirror or pre-populated cache (`npm install --prefer-offline`).

## Available scripts
- `npm run dev` — start the Vite development server
- `npm run build` — type-check and create the production build
- `npm run preview` — serve the production build locally
- `npm run lint` — run ESLint against TypeScript/React sources
- `npm run test` — execute unit tests in watch mode with Vitest
- `npm run test:unit` — run the Vitest suite once with coverage enabled
- `npm run test:e2e` — launch the Playwright test runner (requires a production build)

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
  pages/          # Feature pages: Log, Budgets, Reports, Settings
  styles/         # Global design tokens and base theme
```

Additional directories of note:
- `src/db` for the Dexie schema and database helpers
- `src/services` for domain services
- `src/utils` for shared utility functions and React hooks

## Contributing
See `CONTRIBUTING.md`. Code of Conduct: `CODE_OF_CONDUCT.md`.

## License
See `LICENSE`.
