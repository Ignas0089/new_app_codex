# UI State Mapping

This document outlines how data from the `@services` layer populates UI state containers.
It is intended to help designers, engineers, and QA trace data dependencies across views.

## Global App Shell
- **User session** sourced from `@services/auth.getSession` and stored in the root `AppStore`.
- **Workspace preferences** fetched via `@services/settings.getWorkspace` and exposed through context providers for currency + locale.
- **Feature flags** loaded from `@services/flags.list` and cached in memory with hydration from `localStorage`.

## Dashboard
- **Balance overview widget** consumes `@services/insights.getSummary` -> aggregated totals mapped to chart props.
- **Recent transactions table** uses `@services/transactions.list({ limit: 10 })` and normalizes into table rows with status metadata.
- **Alerts banner** listens for `@services/alerts.stream` SSE feed to push notifications into toast queue state.

## Transaction Entry Panel
- **Form defaults** pulled from `@services/preferences.getDefaults` and set as initial form state values.
- **Category autocomplete** calls `@services/categories.search` on input changes; results cached locally per query for 5 minutes.
- **Submission lifecycle** dispatches `@services/transactions.create`, transitioning UI states: `idle -> submitting -> success|error`.

## Insights Area
- **Tab content** orchestrated by `Tabs` component; data resolved via hooks that wrap `@services/insights.*` endpoints.
- **Filters** stored in URL search params; updates trigger revalidation of `getSummary` and `getCategoryDetail`.
- **Recommendations** derived from `@services/rules.suggest` and mapped into `Card` components with CTA metadata.

## Settings
- **Profile form** fetches data from `@services/users.getProfile` and uses optimistic updates with fallback to server snapshot.
- **Currency options** re-use the cached response of `@services/settings.fetchCurrencies` or request fresh data on expiry.
- **Access management** surfaces member list from `@services/members.list`; actions feed toast feedback state via `Button` loading props.

## Error & Offline Handling
- All service hooks surface `status`, `error`, and `data` to components, allowing consistent `Badge` usage for statuses.
- Failed mutations store the payload in a retry queue persisted by IndexedDB.
- Offline detection toggles a global banner component that disables high-risk actions using the `Button` `disabled` prop.
