## Summary

Describe the requested change and the implemented outcome.

Closes #<issue number>

## Motivation

Explain why this change is needed for the finance dashboard.

## Change Type

- [ ] Initial application delivery
- [ ] Dashboard enhancement
- [ ] Data integration update
- [ ] Test / validation improvement
- [ ] GitHub workflow improvement

## Areas Touched

- [ ] `src/domain` (pure logic)
- [ ] `src/services` (data providers)
- [ ] `server/` (Yahoo proxy)
- [ ] `src/state`
- [ ] `src/components` / `src/pages`
- [ ] CI / repository config

## Bob Collaboration Notes

Document how IBM Bob supported this change:
- repository analysis
- implementation
- validation
- diff review
- PR description generation

## Validation

```bash
npm ci
npm run validate   # lint + typecheck + test + build
```

- [ ] `npm run validate` passes locally
- [ ] New or changed behaviour has tests
- [ ] No live Yahoo Finance calls added to tests

## Feature Request Alignment

If this PR addresses a GitHub issue, explain:
- requested behaviour
- acceptance criteria and how each is met
- anything intentionally left out

## Screenshots / Demo Notes

Add screenshots, short recordings, or demo notes if relevant.

## Risks / Follow-Up

List known limitations, future improvements, or follow-up items.
