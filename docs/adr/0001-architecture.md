# ADR 0001: Architecture of the market dashboard

Status: Accepted

## Context

The lab needs a React dashboard comparing IBM with up to four competitors over three windows
(current day, last 7 days, last quarter) using Yahoo Finance data. The app will later be extended
through GitHub issues and pull requests, including by Bob, so the structure must keep changes local.

## Decisions

1. **Browser never calls Yahoo.** `yahoo-finance2` is a Node library, Yahoo has no CORS support and the
   API is unofficial and changes. A thin Express proxy (`server/`) is the only code that touches Yahoo.
2. **UI depends on `MarketDataProvider`** (`src/services/MarketDataProvider.ts`). Implementations:
   `HttpProvider` (proxy), `MockProvider` (offline, deterministic) and `YahooAdapter` (server only).
   Swapping the data source never touches components.
3. **Layering is one-directional:** `components -> state -> services -> domain`. `src/domain` has no
   React or network imports and holds all calculations, so it is cheap to test.
4. **Per-symbol results.** Every response is a list of `ok | error` results. One failing competitor
   must not blank the dashboard.
5. **Server state with TanStack Query, UI state with Zustand.** Caching, retries, cancellation and
   loading/error states come from Query. Zustand holds only the selected window and symbol list.
6. **Carbon Design System and Carbon Charts.** `LineChartPanel` is the only file importing the chart
   library. Series are rebased to 100 so symbols with different share prices share one axis.
7. **Tests never call live Yahoo.** Vitest + Testing Library + MSW for the UI and service layers,
   supertest and a fake client for the server.

## Consequences

- Extra process to run (`npm run dev:all`), mitigated by `VITE_DATA_SOURCE=mock` for UI-only work.
- Yahoo may rate limit or change shape. The adapter maps failures to safe error codes and caches
  results briefly; fixtures keep demos and CI stable.
- A feature such as "graph for a user-selected company" needs one `uiStore` field, one extra query
  through the existing provider, and one `ChartCard`; no architectural change.

## Extension points

| Change | Where |
|---|---|
| Add or swap competitors | `src/config/companies.ts` (max 5, enforced by `MAX_SYMBOLS`) |
| New time window | one row in `src/domain/windows.ts`, then a tab and test |
| New data source | implement `MarketDataProvider` |
| New chart | new component under `src/components/charts`, fed from `src/domain` |
