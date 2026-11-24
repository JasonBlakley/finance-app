import { companyName } from '../config/companies';
import type { PricePoint, Quote, Series, SymbolResult, TimeWindow } from '../domain';
import { percentChange } from '../domain';

/** Deterministic offline data. Used by MockProvider and by the proxy when SERVER_DATA_SOURCE=mock. */

/** Symbols the mock treats as unknown, so error paths can be demonstrated and tested. */
export const MOCK_UNKNOWN_SYMBOLS = new Set(['ZZZZ']);

const MINUTE = 60_000;
const SHAPE: Record<TimeWindow, { count: number; stepMs: number }> = {
  DAY: { count: 78, stepMs: 5 * MINUTE },
  WEEK: { count: 84, stepMs: 120 * MINUTE },
  QUARTER: { count: 62, stepMs: 24 * 60 * MINUTE },
};

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function basePrice(symbol: string): number {
  return 80 + (hash(symbol) % 32000) / 100;
}

export function mockSeries(symbol: string, window: TimeWindow, endMs: number): Series {
  const { count, stepMs } = SHAPE[window];
  const rand = mulberry32(hash(`${symbol}:${window}`));
  const volatility = window === 'DAY' ? 0.0015 : window === 'WEEK' ? 0.004 : 0.012;
  const points: PricePoint[] = [];
  let price = basePrice(symbol);
  for (let i = 0; i < count; i++) {
    price = Math.max(1, price * (1 + (rand() - 0.48) * volatility * 2));
    points.push({ t: endMs - (count - 1 - i) * stepMs, close: Math.round(price * 100) / 100 });
  }
  return { symbol, points };
}

export function mockQuote(symbol: string, endMs: number): Quote {
  const day = mockSeries(symbol, 'DAY', endMs).points;
  const price = day[day.length - 1].close;
  const previousClose = day[0].close;
  return {
    symbol,
    name: companyName(symbol),
    price,
    previousClose,
    change: Math.round((price - previousClose) * 100) / 100,
    changePercent: percentChange(previousClose, price),
    currency: 'USD',
  };
}

function notFound<T>(symbol: string): SymbolResult<T> {
  return {
    symbol,
    status: 'error',
    error: { code: 'SYMBOL_NOT_FOUND', message: `No market data found for ${symbol}.` },
  };
}

export function mockQuoteResults(symbols: string[], endMs: number): SymbolResult<Quote>[] {
  return symbols.map((symbol) =>
    MOCK_UNKNOWN_SYMBOLS.has(symbol)
      ? notFound<Quote>(symbol)
      : { symbol, status: 'ok', data: mockQuote(symbol, endMs) },
  );
}

export function mockSeriesResults(
  symbols: string[],
  window: TimeWindow,
  endMs: number,
): SymbolResult<Series>[] {
  return symbols.map((symbol) =>
    MOCK_UNKNOWN_SYMBOLS.has(symbol)
      ? notFound<Series>(symbol)
      : { symbol, status: 'ok', data: mockSeries(symbol, window, endMs) },
  );
}
