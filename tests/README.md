# Testing Guide

This project uses **Vitest** for unit tests and **Playwright** for browser automation. The goal is to keep local and CI executions identical.

## Prerequisites

- Node.js 20+
- npm 9+ (or pnpm/yarn if you mirror the scripts)
- For Playwright: download browsers once via `npx playwright install` (CI runs `npx playwright install --with-deps`).

## Commands

| Purpose | Command |
| --- | --- |
| Run unit tests with coverage | `npm run test:unit` |
| Run unit tests in watch mode | `npm run test` |
| Execute Playwright E2E suite | `npm run test:e2e` |
| Open the Playwright UI | `npm run test:e2e -- --ui` |

Unit tests rely on deterministic test doubles in `src/test/utils`. Playwright scenarios expect a built application served on port `4173` (configurable via `PLAYWRIGHT_BASE_URL`).

## Test data preparation

- `tests/fixtures/sample-backup.json` contains a minimal dataset that can be imported through the in-app JSON backup flow. This enables deterministic seeded states for manual or automated testing.
- The `src/test/setup.ts` file centralises shared mocks (e.g., `createId`) and cleans up React trees after each test.

## Continuous Integration

The GitHub Actions workflow runs the following steps:

1. `npm run lint`
2. `npm run test:unit`
3. `npm run build`
4. `npx playwright install --with-deps`
5. `npm run test:e2e`

Refer to [`tests/plan.md`](./plan.md) for planned integration and end-to-end coverage.
