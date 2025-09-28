# Expense Tracker (Desktop, EUR, English)

[![CI][ci-badge]][ci-workflow]

Manual expense logging with monthly category budgets and clear charts. Local-first (IndexedDB), no accounts.

## Features (MVP)
- Log: amount, date, category, note
- Budgets: per category per month, carry-over toggle
- Reports: Budget vs Actual, Spend by Category, Trend Over Time
- Export/Import JSON backups

## Quick start

### Using pnpm (recommended)
1. Install dependencies: `pnpm install`
2. Start development server: `pnpm dev`
3. Visit http://localhost:5173

### Using npm
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Visit http://localhost:5173

> **Note:** Package downloads require internet access. In restricted environments use a local npm mirror or a pre-populated cache (`pnpm install --offline` or `npm install --prefer-offline`).

## Available scripts
- `pnpm dev` / `npm run dev` — start the Vite development server
- `pnpm build` / `npm run build` — type-check and create the production build
- `pnpm preview` / `npm run preview` — serve the production build locally
- `pnpm lint` / `npm run lint` — run ESLint against TypeScript/React sources
- `pnpm test` / `npm run test` — execute unit tests in watch mode with Vitest
- `pnpm test:unit` / `npm run test:unit` — run the Vitest suite once with coverage enabled
- `pnpm test:e2e` / `npm run test:e2e` — launch the Playwright test runner (requires a production build)

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

[ci-badge]: https://github.com/your-org/simple-ledger/actions/workflows/ci.yml/badge.svg
[ci-workflow]: https://github.com/your-org/simple-ledger/actions/workflows/ci.yml
