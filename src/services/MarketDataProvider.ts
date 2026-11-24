import type { Quote, Series, SymbolResult, TimeWindow } from '../domain';

/**
 * The only thing the UI knows about market data. Implementations: HttpProvider (proxy)
 * and MockProvider (offline fixtures). Results are per symbol so one failure never
 * blanks the dashboard. Whole-request failures (network down) reject with an AppError.
 */
export interface MarketDataProvider {
  getQuotes(symbols: string[], signal?: AbortSignal): Promise<SymbolResult<Quote>[]>;
  getSeries(
    symbols: string[],
    window: TimeWindow,
    signal?: AbortSignal,
  ): Promise<SymbolResult<Series>[]>;
}
