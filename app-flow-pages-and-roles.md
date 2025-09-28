# app-flow-pages-and-roles.md

## Site map with activities, transitions, and data
| Page | Core activities | Primary transitions | Data inputs | Data outputs |
| --- | --- | --- | --- | --- |
| **Log** | Capture new expenses, edit or delete entries, filter table by month/category/text, undo last change. | Navigate to Budgets (budget badges link), Reports (view charts for selected month), Settings (manage categories/backups). | Amount, date, category, note, undo stack actions. | Updated expenses list, recalculated budget badges, keyboard feedback, persisted expense records in IndexedDB. |
| **Budgets** | Create/update per-category monthly limits, toggle carry-over, review status badges. | Jump to Log (via category quick link) to adjust spending, to Reports (see visualized impact), to Settings (manage categories). | Limit amount, carry-over toggle, month selection. | Budget records saved to IndexedDB, status badge values (OK/Approaching/Over), available vs used amounts. |
| **Reports** | Inspect Budget vs Actual, Spend by Category, Trend Over Time charts, change month range. | Return to Log (drill down on expenses), to Budgets (adjust limits when charts warn), to Settings (export data snapshots). | Month selector, category filters (when drilling down), chart configuration options. | Chart datasets generated from expenses/budgets, CSV/PNG exports (future), status insights for decisions. |
| **Settings** | Manage categories (CRUD/hide), export/import JSON backup, clear data, adjust UX preferences. | Redirect to Log after category changes, to Budgets after limit reset, to Reports after data import refresh. | Category names/colors, backup file upload, confirmation inputs for destructive actions, preference toggles. | Updated category collection, exported `backup.json`, confirmation dialogs, success/error notifications. |
| **Onboarding/Empty state** | Provide quick tour, seed preset categories, guide to first expense entry. | Direct to Log start form, Settings for category customization. | Optional tour choices, initial preferences. | Seeded data, dismissal state saved to IndexedDB settings. |

## User roles, goals, and page-level conditions

### Primary user — "Solo budgeter"
- **Profile:** Individual tracking personal or household spending on a desktop browser, no accounts.

| Page | Goal | Start condition | Completion condition |
| --- | --- | --- | --- |
| Log | Record expenses quickly and keep timeline tidy. | Arrives with application loaded, IndexedDB ready, optional seeded categories. | Expense saved, appears in filtered list, undo option available, totals/badges updated. |
| Budgets | Ensure categories have monthly limits and monitor status. | Opens page with at least one category defined and selected month context. | Limits stored, carry-over preference set, status badges reflecting latest spend. |
| Reports | Understand spending patterns visually. | Accesses page with historical expense data and at least one month selected. | Charts rendered with current filters, insights noted for next actions. |
| Settings | Maintain data hygiene and tailor categories/preferences. | Visits settings with intention to organize categories or data, backup service idle. | Desired change applied (categories updated, backup exported/imported, data cleared) with confirmation. |
| Onboarding/Empty state | Learn basics and configure initial data. | First-time visit or cleared database triggers empty state. | Completed tour or seeded categories accepted; redirected to Log for first entry. |

### Future role — "Shared household partner"
- **Profile:** Potential second person sharing the same desktop/browser in alternating sessions.

| Page | Goal | Start condition | Completion condition |
| --- | --- | --- | --- |
| Log | Review partner's recent expenses and add complementary entries. | Opens app with shared IndexedDB data, aware of partner activity. | Entries reconciled (notes clarified), duplicates removed, conversation notes left in comments. |
| Budgets | Negotiate shared limits per category. | Both partners agree to review monthly budgets together. | Limits adjusted collaboratively, carry-over toggles set, notes captured externally. |
| Reports | Align on spending trends for joint decisions. | At least two months of data present; partner available for review. | Charts reviewed, action list decided (e.g., reduce dining out). |
| Settings | Coordinate backups and category taxonomy. | Scheduled maintenance session; backup/export intentions aligned. | Fresh backup created before major changes; categories aligned to shared naming. |
| Onboarding/Empty state | Quickly understand existing setup when joining later. | Partner joins after data already exists or after reset. | Reads condensed summary, acknowledges previous data context, continues to Log. |

### Future role — "Financial coach" (advisory, read-only)
- **Profile:** External advisor briefly reviewing data to provide guidance.

| Page | Goal | Start condition | Completion condition |
| --- | --- | --- | --- |
| Log | Spot anomalies or missing categorization. | Granted supervised access, no editing rights (future read-only mode). | Produces list of suggested corrections or notes for primary user. |
| Budgets | Assess realism of limits. | Receives snapshot or guided session with data visible. | Provides recommendations for adjustments; leaves comments offline. |
| Reports | Evaluate long-term trends for coaching. | Access to reports with filters preset by primary user. | Identifies patterns, outputs advice summary. |
| Settings | Verify backup discipline and data integrity. | Observes settings via screen-share or exported log. | Confirms backup routine exists; suggests improvements. |
| Onboarding/Empty state | Not directly used (advisor enters existing setup). | n/a | n/a |

## Textual user flows mapped to SPEC-1 acceptance criteria

### Flow 1 — Add expense and persist after refresh (M1 Acceptance)
1. **Start:** Solo budgeter on Log page with quick-add form focused on amount, IndexedDB seeded, month filter set to current month.
2. Enter amount, press `Tab`, fill date (auto defaults to today), select category via keyboard, optionally add note.
3. Activate **Save** (Enter key). Form validates input (amount ≥ 0, date valid) and writes expense to IndexedDB.
4. Log table refreshes in-place, showing new row at top with running total updated; undo toast appears.
5. User refreshes browser (Cmd/Ctrl+R). Application reloads, Dexie bootstraps, expenses rehydrate, filter re-applies current month.
6. **Finish:** Newly added expense still visible with correct totals, satisfying persistence expectation.

### Flow 2 — Budget badge updates after new entry (M2 Acceptance)
1. **Start:** Solo budgeter on Budgets page with monthly limits configured for current month; status badges show "OK".
2. Switch to Log page using navigation tab; quick-add form preselects same month context.
3. Add expense in category nearing its limit (e.g., amount pushes to 85%).
4. After save, background recalculates budget status (actual spend ÷ limit). Badge in Log sidebar updates to "Approaching".
5. User returns to Budgets page; grid fetches latest spend totals and displays updated badge and available amount.
6. **Finish:** Budgets page clearly shows recalculated status reflecting new entry.

### Flow 3 — Reports react to month change (M3 Acceptance)
1. **Start:** Solo budgeter on Reports page with default month = current.
2. Selects previous month via month picker (keyboard or mouse).
3. Page triggers data query for expenses/budgets in chosen month and recomputes datasets for all charts.
4. Budget vs Actual bars, Spend by Category pie, and Trend line animate to new values; legend updates accordingly.
5. **Finish:** Charts now reflect selected month, confirming dynamic response to filter change.

### Flow 4 — Backup export, clear data, and restore (M4 Acceptance)
1. **Start:** Solo budgeter enters Settings > Data section with existing expenses/budgets present.
2. Clicks **Export JSON**; system serializes categories, budgets, expenses, settings into `backup.json` and triggers download confirmation.
3. User selects **Clear data** (with confirmation). IndexedDB stores wiped; UI routes to onboarding empty state.
4. From Settings, choose **Import JSON**, pick the previously downloaded file. Application validates schema and writes records back.
5. On completion, success toast appears; navigation prompt to Log provided.
6. Return to Log page; table repopulates with restored entries, badges re-evaluated.
7. **Finish:** Data fully restored from backup, matching pre-clear state.

### Flow 5 — UX polish & performance smoke (M5 Acceptance)
1. **Start:** Solo budgeter revisiting app after MVP, with >1k expenses ensuring virtualization activated.
2. Navigates Log table using keyboard arrows; focus stays visible, virtualization keeps scroll smooth.
3. Triggers help tooltip from empty-state or info icon to review keyboard shortcuts.
4. Opens Lighthouse (desktop) audit; app passes performance/structure thresholds set by spec.
5. **Finish:** Interaction remains responsive, validations show friendly copy, acceptance for polish milestone satisfied.
