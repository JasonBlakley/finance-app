import { describe, expect, it } from 'vitest';
import { applyWindow, normalizePoints } from './normalize';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

describe('normalizePoints', () => {
  it('drops null/invalid candles, sorts and de-duplicates', () => {
    const out = normalizePoints([
      { date: 3000, close: 3 },
      { date: 1000, close: 1 },
      { date: 2000, close: null },
      { date: null, close: 9 },
      { date: 'not a date', close: 5 },
      { date: 1000, close: 1.5 },
      { date: new Date(4000), close: Number.NaN },
    ]);
    expect(out).toEqual([
      { t: 1000, close: 1.5 },
      { t: 3000, close: 3 },
    ]);
  });
  it('returns empty for empty input', () => {
    expect(normalizePoints([])).toEqual([]);
  });
});

describe('applyWindow', () => {
  const end = Date.UTC(2026, 0, 15, 20, 0, 0);

  it('DAY keeps only the latest session', () => {
    const points = [
      { t: end - DAY - HOUR, close: 1 },
      { t: end - 2 * HOUR, close: 2 },
      { t: end, close: 3 },
    ];
    expect(applyWindow(points, 'DAY').map((p) => p.close)).toEqual([2, 3]);
  });

  it('WEEK keeps the trailing 7 days relative to the latest point', () => {
    const points = [
      { t: end - 8 * DAY, close: 1 },
      { t: end - 6 * DAY, close: 2 },
      { t: end, close: 3 },
    ];
    expect(applyWindow(points, 'WEEK').map((p) => p.close)).toEqual([2, 3]);
  });

  it('QUARTER keeps roughly 3 months', () => {
    const points = [
      { t: end - 100 * DAY, close: 1 },
      { t: end - 80 * DAY, close: 2 },
      { t: end, close: 3 },
    ];
    expect(applyWindow(points, 'QUARTER').map((p) => p.close)).toEqual([2, 3]);
  });

  it('handles empty input', () => {
    expect(applyWindow([], 'DAY')).toEqual([]);
  });
});
