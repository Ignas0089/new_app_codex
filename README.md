# Expense Tracker (Desktop, EUR, English)

Manual expense logging with monthly category budgets and clear charts. Local-first (IndexedDB), no accounts.

## Features (MVP)
- Log: amount, date, category, note
- Budgets: per category per month, carry-over toggle
- Reports: Budget vs Actual, Spend by Category, Trend Over Time
- Export/Import JSON backups

## Quick start
1. Install dependencies: `pnpm install`
2. Start development server: `pnpm dev`
3. Visit http://localhost:5173

> **Note:** Package downloads require internet access. In restricted environments run `pnpm install --offline` with a prepared store.

## Available scripts
- `pnpm dev` — start Vite development server
- `pnpm build` — type-check and create production build
- `pnpm preview` — serve the production build locally
- `pnpm lint` — run ESLint against TypeScript/React sources
- `pnpm test` — execute unit tests with Vitest (to be added in later stages)

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

## Current limitations
- Tab content is placeholder-only; Stage 3 will add the real forms, tables, and dashboards referenced in each page description.
- Automated tests are not yet implemented even though the tooling is scaffolded (`pnpm test` is reserved for future work).

## Contributing
See `CONTRIBUTING.md`. Code of Conduct: `CODE_OF_CONDUCT.md`.

## License
See `LICENSE`.
