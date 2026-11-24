import YahooFinance from 'yahoo-finance2';
import { WINDOWS, percentChange } from '../src/domain';
import type { ErrorInfo, Quote, Series, SymbolResult, TimeWindow } from '../src/domain';
import { normalizePoints, applyWindow } from '../src/services/normalize';
import type { MarketDataProvider } from '../src/services/MarketDataProvider';
import { TtlCache } from './cache';

const DAY_MS = 24 * 60 * 60 * 1000;
const UPSTREAM_TIMEOUT_MS = 8_000;

/** The slice of yahoo-finance2 this adapter needs. Lets tests inject a fake. */
export interface YahooClient {
  quote(symbol: string): Promise<{
    shortName?: string;
    longName?: string;
    currency?: string;
    regularMarketPrice?: number;
    regularMarketPreviousClose?: number;
  } | undefined>;
  chart(
    symbol: string,
    options: { period1: Date; interval: '5m' | '30m' | '1d' },
  ): Promise<{ quotes: Array<{ date: Date; close: number | null }> }>;
}

export function createYahooClient(): YahooClient {
  const yahoo = new YahooFinance();
  return {
    // yahoo.quote() is overloaded and its first overload is a union type; we only read common fields.
    quote: (symbol) => yahoo.quote(symbol) as ReturnType<YahooClient['quote']>,
    chart: (symbol, options) => yahoo.chart(symbol, options),
  };
}

const QUOTE_TTL_MS = 30_000;
const SERIES_TTL_MS: Record<TimeWindow, number> = {
  DAY: 60_000,
  WEEK: 5 * 60_000,
  QUARTER: 15 * 60_000,
};

class NoDataError extends Error {}

/** Translate upstream failures into safe codes. Raw upstream messages are never forwarded to clients. */
export function mapUpstreamError(error: unknown): ErrorInfo {
  if (error instanceof NoDataError) {
    return { code: 'NO_DATA', message: 'No market data is available for this symbol right now.' };
  }
  const text = error instanceof Error ? `${error.name} ${error.message}` : '';
  if (/\b429\b|too many requests/i.test(text)) {
    return { code: 'RATE_LIMITED', message: 'The data provider is rate limiting requests. Try again shortly.' };
  }
  if (/\b404\b|not found|no data found|delisted/i.test(text)) {
    return { code: 'SYMBOL_NOT_FOUND', message: 'No market data found for this symbol.' };
  }
  return { code: 'UPSTREAM_UNAVAILABLE', message: 'The market data provider is currently unavailable.' };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('upstream timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export class YahooAdapter implements MarketDataProvider {
  private readonly quoteCache: TtlCache<Quote>;
  private readonly seriesCache: TtlCache<Series>;

  constructor(
    private readonly client: YahooClient = createYahooClient(),
    private readonly now: () => number = Date.now,
  ) {
    this.quoteCache = new TtlCache<Quote>(now);
    this.seriesCache = new TtlCache<Series>(now);
  }

  getQuotes(symbols: string[]): Promise<SymbolResult<Quote>[]> {
    return Promise.all(
      symbols.map((symbol) =>
        this.settle(symbol, async () => {
          const cached = this.quoteCache.get(symbol);
          if (cached) return cached;
          const raw = await withTimeout(this.client.quote(symbol), UPSTREAM_TIMEOUT_MS);
          const price = raw?.regularMarketPrice;
          const previousClose = raw?.regularMarketPreviousClose;
          if (price == null || previousClose == null) throw new NoDataError();
          const quote: Quote = {
            symbol,
            name: raw?.shortName ?? raw?.longName ?? symbol,
            price,
            previousClose,
            change: price - previousClose,
            changePercent: percentChange(previousClose, price),
            currency: raw?.currency ?? 'USD',
          };
          this.quoteCache.set(symbol, quote, QUOTE_TTL_MS);
          return quote;
        }),
      ),
    );
  }

  getSeries(symbols: string[], window: TimeWindow): Promise<SymbolResult<Series>[]> {
    const config = WINDOWS[window];
    return Promise.all(
      symbols.map((symbol) =>
        this.settle(symbol, async () => {
          const key = `${symbol}:${window}`;
          const cached = this.seriesCache.get(key);
          if (cached) return cached;
          const raw = await withTimeout(
            this.client.chart(symbol, {
              period1: new Date(this.now() - config.lookbackDays * DAY_MS),
              interval: config.interval,
            }),
            UPSTREAM_TIMEOUT_MS,
          );
          const points = applyWindow(
            normalizePoints(raw.quotes.map((q) => ({ date: q.date, close: q.close }))),
            window,
          );
          if (points.length === 0) throw new NoDataError();
          const series: Series = { symbol, points };
          this.seriesCache.set(key, series, SERIES_TTL_MS[window]);
          return series;
        }),
      ),
    );
  }

  private async settle<T>(symbol: string, load: () => Promise<T>): Promise<SymbolResult<T>> {
    try {
      return { symbol, status: 'ok', data: await load() };
    } catch (error) {
      const info = mapUpstreamError(error);
      if (info.code === 'UPSTREAM_UNAVAILABLE') {
        console.error(`[yahoo] ${symbol}: ${error instanceof Error ? error.name : 'unknown error'}`);
      }
      return { symbol, status: 'error', error: info };
    }
  }
}
