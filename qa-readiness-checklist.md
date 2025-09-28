# QA Readiness Checklist

## Environment & Access
- [ ] Test builds available in staging with environment parity to production.
- [ ] Feature flags documented with default states and test overrides.
- [ ] QA accounts prepared with necessary roles and seed data.

## Functional Coverage
- [ ] Acceptance criteria mapped to test cases (manual + automated).
- [ ] Regression suite updated to include new or impacted areas.
- [ ] Edge cases identified from analytics, support tickets, and domain knowledge.

## Data & Integration
- [ ] API contracts validated with up-to-date schema mocks.
- [ ] Third-party integrations have sandbox credentials and test scenarios.
- [ ] Error logging and monitoring configured for the new feature.

## Accessibility & Performance
- [ ] Accessibility acceptance checks (keyboard, screen reader, color contrast) scheduled.
- [ ] Performance budgets defined; synthetic tests configured in CI.
- [ ] Loading states and offline handling verified where applicable.

## Release Communication
- [ ] Test plan reviewed and approved by QA lead and product owner.
- [ ] Known issues documented with severity and mitigation.
- [ ] Rollback strategy verified with engineering.
