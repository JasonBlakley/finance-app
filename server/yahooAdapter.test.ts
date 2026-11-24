import { describe, expect, it, vi } from 'vitest';
import { YahooAdapter, mapUpstreamError } from './yahooAdapter';
import type { YahooClient } from './yahooAdapter';

const NOW = Date.UTC(2026, 0, 15, 20, 0, 0);
const HOUR = 3_600_000;

function fakeClient(overrides: Partial<YahooClient> = {}): YahooClient {
  return {
    quote: vi.fn().mockResolvedValue({
      shortName: 'International Business Machines',
      currency: 'USD',
      regularMarketPrice: 210,
      regularMarketPreviousClose: 200,
    }),
    chart: vi.fn().mockResolvedValue({
      quotes: [
        { date: new Date(NOW - 2 * HOUR), close: 100 },
        { date: new Date(NOW - HOUR), close: null },
        { date: new Date(NOW), close: 110 },
      ],
    }),
    ...overrides,
  };
}

describe('YahooAdapter.getQuotes', () => {
  it('maps the upstream quote and computes change', async () => {
    const adapter = new YahooAdapter(fakeClient(), () => NOW);
    const [result] = await adapter.getQuotes(['IBM']);
    expect(result).toMatchObject({
      status: 'ok',
      data: { symbol: 'IBM', price: 210, previousClose: 200, change: 10, changePercent: 5, currency: 'USD' },
    });
  });

  it('flags quotes without price data as NO_DATA', async () => {
    const client = fakeClient({ quote: vi.fn().mockResolvedValue({ currency: 'USD' }) });
    const [result] = await new YahooAdapter(client, () => NOW).getQuotes(['IBM']);
    expect(result).toMatchObject({ status: 'error', error: { code: 'NO_DATA' } });
  });

  it('isolates failures per symbol', async () => {
    const quote = vi.fn().mockImplementation(async (symbol: string) => {
      if (symbol === 'SAP') throw new Error('Not Found');
      return { regularMarketPrice: 10, regularMarketPreviousClose: 10 };
    });
    const results = await new YahooAdapter(fakeClient({ quote }), () => NOW).getQuotes(['IBM', 'SAP']);
    expect(results[0].status).toBe('ok');
    expect(results[1]).toMatchObject({ status: 'error', error: { code: 'SYMBOL_NOT_FOUND' } });
  });

  it('caches quotes within the TTL', async () => {
    const client = fakeClient();
    const adapter = new YahooAdapter(client, () => NOW);
    await adapter.getQuotes(['IBM']);
    await adapter.getQuotes(['IBM']);
    expect(client.quote).toHaveBeenCalledTimes(1);
  });
});

describe('YahooAdapter.getSeries', () => {
  it('drops null candles and requests the configured interval', async () => {
    const client = fakeClient();
    const [result] = await new YahooAdapter(client, () => NOW).getSeries(['IBM'], 'DAY');
    expect(result).toMatchObject({ status: 'ok', data: { points: [{ close: 100 }, { close: 110 }] } });
    expect(client.chart).toHaveBeenCalledWith('IBM', expect.objectContaining({ interval: '5m' }));
  });

  it('reports NO_DATA when nothing usable comes back', async () => {
    const client = fakeClient({ chart: vi.fn().mockResolvedValue({ quotes: [] }) });
    const [result] = await new YahooAdapter(client, () => NOW).getSeries(['IBM'], 'WEEK');
    expect(result).toMatchObject({ status: 'error', error: { code: 'NO_DATA' } });
  });

  it('never leaks raw upstream error text', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const client = fakeClient({ chart: vi.fn().mockRejectedValue(new Error('internal stack /srv/secret')) });
    const [result] = await new YahooAdapter(client, () => NOW).getSeries(['IBM'], 'WEEK');
    expect(JSON.stringify(result)).not.toContain('secret');
    expect(result).toMatchObject({ status: 'error', error: { code: 'UPSTREAM_UNAVAILABLE' } });
    error.mockRestore();
  });
});

describe('mapUpstreamError', () => {
  it('recognises rate limiting', () => {
    expect(mapUpstreamError(new Error('HTTP 429 Too Many Requests')).code).toBe('RATE_LIMITED');
  });
  it('falls back to UPSTREAM_UNAVAILABLE for unknown values', () => {
    expect(mapUpstreamError('weird').code).toBe('UPSTREAM_UNAVAILABLE');
  });
});
