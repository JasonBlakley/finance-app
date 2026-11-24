# Finance App: IBM Market Dashboard

React dashboard comparing **IBM** with up to four competitors (Microsoft, Oracle, SAP, Salesforce) using
Yahoo Finance data, with three views: **current day**, **last 7 days** and **last quarter**.

Built for the Bob GitHub SDLC lab. Stack: Vite, React 19, TypeScript, Carbon Design System,
Carbon Charts, TanStack Query, Zustand, Express, `yahoo-finance2`, Vitest.

## Quick start

```bash
npm ci
npm run dev:all     # UI on http://localhost:5173, proxy on http://localhost:8787
```

No network or Yahoo access? Run the UI against built-in fixtures:

```bash
# PowerShell
$env:VITE_DATA_SOURCE="mock"; npm run dev
# bash
VITE_DATA_SOURCE=mock npm run dev
```

To run the proxy with fixtures instead of live data, set `SERVER_DATA_SOURCE=mock`.
See [`.env.example`](.env.example).

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server (proxies `/api` to the Node server) |
| `npm run dev:server` | Yahoo proxy with watch mode |
| `npm run dev:all` | Both of the above |
| `npm run lint` | ESLint, zero warnings allowed |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (never calls live Yahoo) |
| `npm run build` | Production build into `dist/` |
| `npm run validate` | lint + typecheck + test + build. Same checks as CI |

## Layout

```text
server/          Express proxy. The only code that talks to Yahoo (yahooAdapter.ts)
src/domain/      Pure logic: types, windows, symbol rules, metrics, chart data
src/services/    MarketDataProvider interface; Http, Mock providers; zod schemas; normalization
src/state/       TanStack Query hooks and the Zustand UI store
src/components/  Presentational components (cards, charts, feedback, layout)
src/pages/       DashboardPage (the single container)
src/config/      Companies and colours
docs/adr/        Architecture decisions
```

Dependencies point one way: `components -> state -> services -> domain`.
See [ADR 0001](docs/adr/0001-architecture.md).

## API (proxy)

| Endpoint | Description |
|---|---|
| `GET /api/quotes?symbols=IBM,MSFT` | Current quotes, one `ok`/`error` result per symbol |
| `GET /api/series?symbols=IBM,MSFT&window=DAY\|WEEK\|QUARTER` | Price history for a window |
| `GET /api/health` | Liveness check |

Symbols are validated (`^[A-Z0-9^][A-Z0-9.\-^=]{0,11}$`, at most 5). Upstream errors are mapped to safe
codes and never forwarded verbatim.

## Definition of success

- `npm run validate` passes with no warnings.
- All three tabs render for the five companies; the day view shows quote cards, the other two show a
  ranking table.
- Stop the proxy: the page shows an error panel with a working Retry button, not a blank screen.
- One failing symbol shows a "Partial data" banner while the other companies still render.

## Working with GitHub

1. Open an issue with the **Feature request** template. Write testable acceptance criteria.
2. Branch from `main`: `feature/<slug>`, `fix/<slug>` or `bob/<slug>`.
3. Implement, then run `npm run validate`.
4. Open a PR using the template and include `Closes #<issue>`.
5. CI runs the same `validate` steps. A human reviews and merges.

Example request: [`docs/pr-feature-request-example.md`](docs/pr-feature-request-example.md).

## Notes

- Yahoo Finance is an unofficial API and can change or rate limit. The mock data source keeps demos and
  CI stable. Market data here is for demonstration, not investment decisions.
- The proxy is read-only and has no authentication. Do not expose it publicly as-is.
