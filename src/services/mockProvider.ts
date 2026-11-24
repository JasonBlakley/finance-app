import type { Quote, Series, SymbolResult, TimeWindow } from '../domain';
import type { MarketDataProvider } from './MarketDataProvider';
import { mockQuoteResults, mockSeriesResults } from './mockData';

export class MockProvider implements MarketDataProvider {
  constructor(
    private readonly now: () => number = Date.now,
    private readonly latencyMs = 0,
  ) {}

  private async delay(signal?: AbortSignal): Promise<void> {
    signal?.throwIfAborted();
    if (this.latencyMs > 0) await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    signal?.throwIfAborted();
  }

  async getQuotes(symbols: string[], signal?: AbortSignal): Promise<SymbolResult<Quote>[]> {
    await this.delay(signal);
    return mockQuoteResults(symbols, this.now());
  }

  async getSeries(
    symbols: string[],
    window: TimeWindow,
    signal?: AbortSignal,
  ): Promise<SymbolResult<Series>[]> {
    await this.delay(signal);
    return mockSeriesResults(symbols, window, this.now());
  }
}
