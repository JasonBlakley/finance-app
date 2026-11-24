import { describe, expect, it } from 'vitest';
import { MockProvider } from './mockProvider';

const NOW = Date.UTC(2026, 0, 15, 20, 0, 0);

describe('MockProvider', () => {
  const provider = new MockProvider(() => NOW);

  it('is deterministic for the same inputs', async () => {
    const a = await provider.getSeries(['IBM'], 'WEEK');
    const b = await provider.getSeries(['IBM'], 'WEEK');
    expect(a).toEqual(b);
  });

  it('returns ordered series ending at "now" for each window', async () => {
    for (const window of ['DAY', 'WEEK', 'QUARTER'] as const) {
      const [result] = await provider.getSeries(['IBM'], window);
      expect(result.status).toBe('ok');
      if (result.status !== 'ok') continue;
      const times = result.data.points.map((p) => p.t);
      expect(times).toEqual([...times].sort((x, y) => x - y));
      expect(times[times.length - 1]).toBe(NOW);
    }
  });

  it('returns a per-symbol error for unknown symbols without failing the rest', async () => {
    const results = await provider.getQuotes(['IBM', 'ZZZZ']);
    expect(results[0].status).toBe('ok');
    expect(results[1]).toMatchObject({ status: 'error', error: { code: 'SYMBOL_NOT_FOUND' } });
  });

  it('honours an already-aborted signal', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(provider.getQuotes(['IBM'], controller.signal)).rejects.toBeDefined();
  });
});
