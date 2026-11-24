import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { MockProvider } from '../src/services/mockProvider';
import type { MarketDataProvider } from '../src/services/MarketDataProvider';
import { createApp } from './app';

const NOW = Date.UTC(2026, 0, 15, 20, 0, 0);
const app = createApp(new MockProvider(() => NOW));

describe('GET /api/quotes', () => {
  it('returns per-symbol results', async () => {
    const res = await request(app).get('/api/quotes?symbols=ibm,msft');
    expect(res.status).toBe(200);
    expect(res.body.results.map((r: { symbol: string }) => r.symbol)).toEqual(['IBM', 'MSFT']);
    expect(res.body.results[0].status).toBe('ok');
  });

  it('reports unknown symbols per symbol without failing the request', async () => {
    const res = await request(app).get('/api/quotes?symbols=IBM,ZZZZ');
    expect(res.status).toBe(200);
    expect(res.body.results[1]).toMatchObject({ status: 'error', error: { code: 'SYMBOL_NOT_FOUND' } });
  });

  it.each([
    ['missing', '/api/quotes'],
    ['malformed', '/api/quotes?symbols=IBM,bad%20symbol'],
    ['injection attempt', '/api/quotes?symbols=IBM;rm%20-rf'],
    ['too many', '/api/quotes?symbols=A,B,C,D,E,F'],
  ])('rejects %s symbols with 400', async (_name, url) => {
    const res = await request(app).get(url);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_SYMBOL');
  });

  it('ignores non-string (array) query values safely', async () => {
    const res = await request(app).get('/api/quotes?symbols=IBM&symbols=MSFT');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/series', () => {
  it('returns series for a valid window', async () => {
    const res = await request(app).get('/api/series?symbols=IBM&window=WEEK');
    expect(res.status).toBe(200);
    expect(res.body.window).toBe('WEEK');
    expect(res.body.results[0].data.points.length).toBeGreaterThan(1);
  });

  it('rejects an unknown window', async () => {
    const res = await request(app).get('/api/series?symbols=IBM&window=YEAR');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  it('rejects prototype-key windows', async () => {
    const res = await request(app).get('/api/series?symbols=IBM&window=toString');
    expect(res.status).toBe(400);
  });
});

describe('misc', () => {
  it('serves a health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns a structured 404 for unknown endpoints', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  it('hides provider failures behind a safe 502', async () => {
    const failing: MarketDataProvider = {
      getQuotes: () => Promise.reject(new Error('secret upstream detail')),
      getSeries: () => Promise.reject(new Error('secret upstream detail')),
    };
    const res = await request(createApp(failing)).get('/api/quotes?symbols=IBM');
    expect(res.status).toBe(502);
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });
});
