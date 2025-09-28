# Wireflow: Onboarding & Workspace Setup

1. **Welcome Screen**
   - CTA: "Create my workspace" (primary button).
   - Secondary link: "Import from CSV" opens modal (deferred).
   - Service hooks: none.

2. **Profile Basics Form**
   - Inputs: Full name, organization, base currency (dropdown), fiscal year start (date).
   - Validation: required fields, currency selected from `@services/settings.fetchCurrencies`.
   - On submit: call `@services/auth.createWorkspace` with payload.

3. **Workspace Preferences**
   - Toggles: Enable budgets, enable shared access.
   - Inline info cards describing features.
   - Save triggers `@services/settings.updateWorkspacePrefs`.

4. **Success & Next Steps**
   - Confirmation illustration, summary of configured preferences.
   - CTA: "Invite teammates" -> `Invite` flow (future) or "Start tracking" -> Dashboard.
   - Dismissal logs onboarding completion event via `@services/analytics.track`.

## Edge Cases
- Network failure surfaces inline banner with retry.
- Currency API fallback: default to previous selection with warning badge.
