# Wireflow: Budget Insights Review

1. **Dashboard CTA**
   - User clicks "View insights" card.
   - Fetches latest aggregates via `@services/insights.getSummary`.

2. **Insights Overview**
   - Tabs: Spending, Income, Cashflow (uses `Tabs` component).
   - Charts display monthly trends, categories list top variances.
   - Filter chips for timeframe update state and refetch summary.

3. **Variance Drilldown**
   - Selecting category opens modal with line chart + transactions table.
   - Data from `@services/insights.getCategoryDetail(categoryId)`.
   - Table rows link to transaction detail view.

4. **Action Recommendations**
   - Card stack with suggestions and CTAs.
   - CTAs navigate to budgeting tools or create rules (`@services/rules.create`).

## Empty & Error States
- No data -> show encouragement message with setup checklist.
- API failure -> surface inline alert and allow retry.
