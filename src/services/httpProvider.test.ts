import { http, HttpResponse, delay } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { AppError } from './errors';
import { HttpProvider } from './httpProvider';

const BASE = 'http://market.test/api';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const okQuote = {
  symbol: 'IBM',
  name: 'IBM',
  price: 200,
  previousClose: 198,
  change: 2,
  changePercent: 1.01,
  currency: 'USD',
};

describe('HttpProvider', () => {
  it('returns per-symbol results, including partial failures', async () => {
    server.use(
      http.get(`${BASE}/quotes`, ({ request }) => {
        expect(new URL(request.url).searchParams.get('symbols')).toBe('IBM,ZZZZ');
        return HttpResponse.json({
          results: [
            { symbol: 'IBM', status: 'ok', data: okQuote },
            {
              symbol: 'ZZZZ',
              status: 'error',
              error: { code: 'SYMBOL_NOT_FOUND', message: 'No market data found for ZZZZ.' },
            },
          ],
        });
      }),
    );
    const results = await new HttpProvider(BASE).getQuotes(['IBM', 'ZZZZ']);
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ status: 'ok', symbol: 'IBM' });
    expect(results[1]).toMatchObject({ status: 'error', error: { code: 'SYMBOL_NOT_FOUND' } });
  });

  it('sends the window parameter for series', async () => {
    server.use(
      http.get(`${BASE}/series`, ({ request }) => {
        expect(new URL(request.url).searchParams.get('window')).toBe('WEEK');
        return HttpResponse.json({
          window: 'WEEK',
          results: [{ symbol: 'IBM', status: 'ok', data: { symbol: 'IBM', points: [{ t: 1, close: 2 }] } }],
        });
      }),
    );
    const results = await new HttpProvider(BASE).getSeries(['IBM'], 'WEEK');
    expect(results[0]).toMatchObject({ status: 'ok', data: { points: [{ t: 1, close: 2 }] } });
  });

  it('maps a structured error body to an AppError', async () => {
    server.use(
      http.get(`${BASE}/quotes`, () =>
        HttpResponse.json(
          { error: { code: 'RATE_LIMITED', message: 'Slow down.' } },
          { status: 429 },
        ),
      ),
    );
    await expect(new HttpProvider(BASE).getQuotes(['IBM'])).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      message: 'Slow down.',
    });
  });

  it('maps an unstructured 5xx to UPSTREAM_UNAVAILABLE', async () => {
    server.use(http.get(`${BASE}/quotes`, () => new HttpResponse('boom', { status: 502 })));
    await expect(new HttpProvider(BASE).getQuotes(['IBM'])).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
    });
  });

  it('rejects malformed payloads with BAD_RESPONSE', async () => {
    server.use(http.get(`${BASE}/quotes`, () => HttpResponse.json({ results: [{ nope: true }] })));
    await expect(new HttpProvider(BASE).getQuotes(['IBM'])).rejects.toMatchObject({
      code: 'BAD_RESPONSE',
    });
  });

  it('reports network failures as NETWORK_ERROR', async () => {
    server.use(http.get(`${BASE}/quotes`, () => HttpResponse.error()));
    const error = await new HttpProvider(BASE).getQuotes(['IBM']).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ code: 'NETWORK_ERROR' });
  });

  it('times out slow responses', async () => {
    server.use(
      http.get(`${BASE}/quotes`, async () => {
        await delay(300);
        return HttpResponse.json({ results: [] });
      }),
    );
    await expect(new HttpProvider(BASE, 30).getQuotes(['IBM'])).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      message: expect.stringContaining('timed out'),
    });
  });

  it('propagates caller cancellation instead of wrapping it', async () => {
    server.use(
      http.get(`${BASE}/quotes`, async () => {
        await delay(300);
        return HttpResponse.json({ results: [] });
      }),
    );
    const controller = new AbortController();
    const pending = new HttpProvider(BASE).getQuotes(['IBM'], controller.signal);
    controller.abort();
    const error = await pending.catch((e: unknown) => e);
    expect(error).not.toBeInstanceOf(AppError);
  });
});
