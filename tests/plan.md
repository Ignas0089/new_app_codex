# Integration & E2E Test Plan

This document outlines the target browser automation scenarios that complement the existing unit test suite. Each scenario maps to user-facing value and reuses the shared fixtures under `tests/fixtures/`.

## Environments

- **Local development**: `npm run dev` (Playwright auto-starts the dev server).
- **CI**: Build once (`npm run build`) and serve via `npm run preview` (Playwright config handles this automatically).
- All scenarios use `PLAYWRIGHT_BASE_URL` when specified; otherwise the default `http://127.0.0.1:4173` is used.

## Scenarios

### 1. Budget badge smoke test
- Import `sample-backup.json` via the Settings page.
- Navigate to the Budgets dashboard and assert that a badge for "Groceries" appears with carry-over enabled indicator.
- Trigger a manual refresh (simulating the `useBudgetBadges` hook) and assert that loading feedback is shown and dismissed.

### 2. Expense capture flow
- Start from an empty state (clear database via UI or backup import).
- Create a new category "Travel" and log an expense.
- Verify the entry appears at the top of the list with correct amount, note, and computed month.

### 3. Category management safeguards
- Seed with `sample-backup.json`.
- Attempt to delete the "Groceries" category, expect a blocking confirmation/error message.
- Hide the category instead and confirm it no longer appears in quick selectors while remaining available for reports.

### 4. Reports regression
- With seeded data, open the Reports section.
- Validate charts/tables for budget vs. actual, spend by category, and trend over time reflect the fixture totals.
- Capture accessibility tree snapshots for comparison across runs.

### 5. Backup round-trip
- Export a backup file after making a change.
- Clear data through the UI.
- Re-import the exported backup and assert that categories, budgets, and expenses are restored (spot-check counts and totals).

## Non-functional checks

- Run Playwright in Chromium, Firefox, and WebKit on CI (already configured in `playwright.config.ts`).
- Capture traces on first retry to aid debugging (`trace: 'on-first-retry'`).
- Surface test artifacts via the default Playwright HTML report (CI stores as workflow artifact).

## Future enhancements

- Add visual regression coverage for budget badge states.
- Extend the backup round-trip to compare JSON payloads byte-for-byte.
- Integrate axe-core checks for accessibility within each flow.
