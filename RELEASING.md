# Releasing

Use this checklist to publish a stable build.

## Pre-release

- [ ] Confirm the target branch is up to date with `main`.
- [ ] Review open issues/PRs for blockers and update status labels.
- [ ] Update the version in `package.json` and create a corresponding entry in `CHANGELOG.md`.
- [ ] Run quality gates locally:
  - [ ] `npm run lint`
  - [ ] `npm run test:unit`
  - [ ] `npm run build`
  - [ ] `npx playwright install` (first run only) and `npm run test:e2e`
- [ ] Execute a manual JSON backup/import round-trip using [`tests/fixtures/sample-backup.json`](tests/fixtures/sample-backup.json):
  1. Import the fixture via the Settings page.
  2. Export a new backup and verify the structure matches expectations.
  3. Clear data and re-import the exported file to confirm state is restored.
- [ ] Validate browser compatibility by exercising the smoke tests in Chromium, Firefox, and WebKit (Playwright projects cover this, but perform a quick manual spot-check if UI changes were made).

## Release

- [ ] Create a release branch (`release/vX.Y.Z`) and push it for review.
- [ ] Ensure CI (`CI` workflow badge) is green on the release branch.
- [ ] Tag the release (`git tag vX.Y.Z && git push origin vX.Y.Z`).
- [ ] Publish release notes summarising key changes and linking to the changelog entry.

## Post-release

- [ ] Merge the release branch back into `main` (and `develop` if applicable).
- [ ] Update documentation or project boards with any follow-up actions.
- [ ] Celebrate responsibly 🎉
