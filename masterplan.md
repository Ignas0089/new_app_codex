# masterplan.md

## Elevator pitch (30s)
- Desktop web app to **log expenses by hand**, set **monthly category budgets**, and see **clear charts**.  
- **English UI**, **EUR** currency, **no accounts** (single-user, local-first).  
- Built for speed, clarity, and zero cognitive load.

## Problem & mission
- Problem: spreadsheets get messy; budget tools feel heavy; bank links are overkill.  
- Mission: make daily expense tracking **so simple** you’ll actually use it.

## Target audience
- Individuals in EU using **EUR**, who prefer **manual control**.  
- Beginners to budgeting who want **immediate feedback** without sign-ups.

## Core features (MVP)
- Expense entry: **amount, date, category, note**.
- Category management: **preset list** + add/edit/hide.
- Budgets: **monthly per category**; carry-over toggle.
- Alerts: **approaching** (e.g., 80%) and **over budget** badges.
- Views:
  - **Budget vs Actual** (current month).
  - **Spend by Category** (pie).
  - **Trend Over Time** (line; monthly).
- Data:
  - **Local-first storage** (browser IndexedDB).
  - **Export/Import** JSON (backup/restore).
  - Quick filters: month picker, category, search in notes.
- Quality-of-life: keyboard-first entry, undo last change, simple onboarding.

## High-level tech stack (why)
- Frontend: **React** (componentized UI, fast state).  
- State: **Redux Toolkit** or **Zustand** (simple predictable store).  
- Storage: **IndexedDB** via **Dexie.js** (reliable local data, no server).  
- Charts: **Chart.js** (lightweight, accessible).  
- Build: **Vite** (fast dev), **TypeScript** (fewer bugs).  
- Styling: **Tailwind CSS** (consistent spacing, quick iteration).

## Conceptual data model (ERD in words)
- **Category** (id, name, color?, isActive).  
- **Budget** (id, categoryId, month (YYYY-MM), amountEUR, carryOver?).  
- **Expense** (id, date, amountEUR, categoryId, note).  
- Relations:
  - Category 1—*n* Expense.  
  - Category 1—*n* Budget (one per month).  
- Derived:
  - **Actual per category/month** = sum(Expense.amount where date in month, categoryId).  
  - **Status** = Actual / Budget.

## UI design principles (Krug-aligned)
- **Obvious first step**: big “Add expense” field on home.  
- **Speak user’s language**: “Budget left”, “You’re over by €X”.  
- **One screen = one question**: Log, Review, Budgets.  
- **Don’t make me read**: inline examples (“e.g., 12.50, Groceries”).  
- **Three mindless clicks**: Add → Amount → Save.  
- **Defaults that help**: preset categories; current month auto-selected.

## Security & compliance notes
- No accounts; data stays **on the device** (IndexedDB).  
- Provide **Export/Import** and **Clear data** controls.  
- Respect **GDPR principles**: no remote personal data, no tracking by default.  
- Input validation (amount/date), guard against XSS in notes (escape on render).

## Phased roadmap
- **MVP (Weeks 1–3):**
  - Categories (preset + CRUD), Expenses, Budgets, three charts, alerts, export/import.  
  - Keyboard entry, undo, month picker, empty states.
- **V1 (Weeks 4–6):**
  - Quick-add hotkeys, pinned categories, multi-currency ready (kept at EUR UI).  
  - Simple onboarding tour, performance polish, smoke tests.
- **V2 (Later):**
  - Optional accounts & cloud sync, shared household mode.  
  - CSV import, tags, recurring expenses, envelope budgeting.  
  - AI assist: auto-suggest category from note text.  
  - Mobile layout.

## Risks & mitigations
- **User drop-off from data loss** → Default **autosave**, visible backup/export.  
- **Overcomplex budgets** → Keep to **monthly per category**; advanced rules later.  
- **Chart confusion** → Titles with plain-English insights (“€120 left in Groceries”).  
- **No accounts → one device** → Make Import/Export frictionless; warn before clearing.

## Future expansion ideas
- Bank import via PSD2 providers (post-MVP).  
- Goals (e.g., “save €500 this month”).  
- Notifications (desktop) when nearing limits.  
- Anonymized insights (“avg grocery spend in LT”).