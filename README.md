# Expense Tracker (Desktop, EUR, English)

## What it is
Manual expense logging with monthly category budgets and clear charts. Local-first (IndexedDB), no accounts.

## Features (MVP)
- Log: amount, date, category, note
- Budgets: per category per month, carry-over toggle
- Reports: Budget vs Actual, Spend by Category, Trend Over Time
- Export/Import JSON

## Quick start
1. `npm install`
2. `npm run dev`
3. Open http://localhost:5173

## Tech
React + TypeScript, Vite, Dexie (IndexedDB), Chart.js, Tailwind.

## Project structure
```
src/
  components/
  pages/ (Log, Budgets, Reports, Settings)
  db/ (dexie schema)
  state/
  utils/
```

## Contributing
See `CONTRIBUTING.md`. Code of Conduct: `CODE_OF_CONDUCT.md`.

## License
See `LICENSE`.
