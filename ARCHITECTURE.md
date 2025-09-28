# Architecture

## Overview
- Pure frontend SPA (React, Vite, TS)
- Data persistence: IndexedDB via Dexie
- State: Zustand/Redux (single store)
- Charts: Chart.js

## Data flow
User input → State update → Persist to Dexie → Recompute totals → Update charts

## Pages
Log, Budgets, Reports, Settings
