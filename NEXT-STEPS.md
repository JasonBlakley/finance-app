# Next steps

Saved 2026-11-24. Pick up here when you return to the finance app.

## Current state

- `finance-app/` lives at the workspace root, **outside** the `bobl3` git repo. It has its own git repo (branch `main`).
- Remotes: `origin` = https://github.com/JasonBlakley/finance-app (used for the Stand & Deliver demo); `ibm-backup` = https://github.ibm.com/Jason-Blakley/finance-app (backup only).
- GitHub Actions is **disabled by enterprise admins** on github.ibm.com, so CI cannot run there. That is why the demo repo is on github.com.
- `npm run validate` passes: lint (zero warnings), typecheck, 86 tests in 11 files, production build.
- The proxy was smoke-tested against live Yahoo Finance and the UI was checked in a browser (all three tabs, chart, error panel and Retry).
- The Bob GitHub MCP tools (`github`, `github-ibm`) return "Bad credentials". Fix their tokens before asking Bob to create issues or PRs.

## To do

### 1. Look at the app in a browser
- [ ] `npm ci`
- [x] `npm run dev:all`, then open http://localhost:5173
- [x] Check all three tabs render for IBM, MSFT, ORCL, SAP and CRM
- [x] Check the chart colours, legend, tooltips and axis labels look right (fixed Y-axis range, tooltip total, duplicate card labels)
- [x] Stop the proxy and confirm the error panel and Retry button appear, not a blank page
- [ ] Offline option: `$env:VITE_DATA_SOURCE="mock"; npm run dev` (PowerShell)

### 2. Set up GitHub
- [x] Replace `@your-github-username` in `.github/CODEOWNERS` (now `@JasonBlakley`)
- [x] Create the repository on github.ibm.com and push (backup, remote `ibm-backup`)
- [x] Create the repository on github.com (https://github.com/JasonBlakley/finance-app)
- [ ] Commit the CODEOWNERS/NEXT-STEPS changes, then `git push -u origin main`. Needs a github.com token with `repo` + `workflow` scopes, stored in Git Credential Manager (never in a file or URL)
- [ ] Confirm the **Finance App CI** workflow runs and passes in the Actions tab
- [ ] Enable Issues and Pull Requests, and add branch protection on `main`: require the `validate` check and one review
- [ ] Create the branch for Part 2: `git checkout -b feature/user-selected-company-chart`

### 3. Part 2 feature: graph for a user-selected company
Source request: `docs/pr-feature-request-example.md`
- [ ] Open a GitHub issue with the **Feature request** template and paste in the acceptance criteria
- [ ] Add a `selectedSymbol` field to `src/state/uiStore.ts`
- [ ] Add a `SymbolPicker` component. Validate with `isValidSymbol` / `parseSymbols` from `src/domain/symbols.ts`
- [ ] Fetch with the existing `getSeries([symbol], window)`. No new service is needed
- [ ] Render a new `ChartCard` + `LineChartPanel` for that symbol, below the existing dashboards
- [ ] Show loading and error states, including a clear message for an invalid or unknown symbol
- [ ] Add tests: store flow, invalid input, error state, and that the existing dashboards stay intact
- [ ] `npm run validate`, then open a PR that includes `Closes #<issue>`

### 4. Optional follow-ups
- [ ] Update the original lab docs in `bobl3/Github SDLC Automation/` to match the CI and PR template changes:
  - CI uses `npm ci`, Node 22, and has no `--if-present`
  - the PR template now includes `npm run validate`, a `Closes #` line and an "Areas Touched" checklist
  - the CI file no longer contains the `bob-feature-flow` echo-only job
- [ ] Re-check the Carbon components against the Carbon MCP once it is connected. Carbon APIs were verified from installed type definitions and the build only
- [ ] Add a proxy-level rate limit before exposing it beyond localhost. It has no authentication
- [ ] Add a `.github` Dependabot config if you want automated dependency updates

## Things to remember

- Yahoo Finance is an unofficial API. It can rate limit or change. Use the mock data source for demos and CI.
- Tests never call live Yahoo.
- The five-symbol cap is enforced by the proxy per request. The company list in `src/config/companies.ts` must be kept at five or fewer by hand.
- The Carbon Charts stylesheet import is `@carbon/charts-react/styles.css`. The `dist/` path is not exported.
- Dependencies run one way: `components -> state -> services -> domain`. See `docs/adr/0001-architecture.md`.

## Useful commands

| Command | Purpose |
|---|---|
| `npm run dev:all` | UI on :5173 and proxy on :8787 |
| `npm run validate` | lint + typecheck + test + build. Same checks as CI |
| `npm test` | Vitest only |
| `SERVER_DATA_SOURCE=mock` | Proxy serves fixtures instead of Yahoo |
