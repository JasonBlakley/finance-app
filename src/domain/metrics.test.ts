import { describe, expect, it } from 'vitest';
import { percentChange, periodReturn, rankByReturn, rebase } from './metrics';
import type { Series } from './types';

const pts = (...closes: number[]) => closes.map((close, i) => ({ t: i * 1000, close }));

describe('percentChange', () => {
  it('computes positive and negative change', () => {
    expect(percentChange(100, 110)).toBeCloseTo(10);
    expect(percentChange(100, 90)).toBeCloseTo(-10);
  });
  it('returns 0 for a zero base or non-finite input', () => {
    expect(percentChange(0, 5)).toBe(0);
    expect(percentChange(NaN, 5)).toBe(0);
    expect(percentChange(5, Infinity)).toBe(0);
  });
});

describe('periodReturn', () => {
  it('uses first and last points', () => {
    expect(periodReturn(pts(50, 60, 55))).toBeCloseTo(10);
  });
  it('is 0 for fewer than 2 points', () => {
    expect(periodReturn([])).toBe(0);
    expect(periodReturn(pts(10))).toBe(0);
  });
});

describe('rebase', () => {
  it('starts at 100 and scales proportionally', () => {
    const out = rebase(pts(50, 55, 25));
    [100, 110, 50].forEach((expected, i) => expect(out[i].close).toBeCloseTo(expected));
    expect(out.map((p) => p.t)).toEqual([0, 1000, 2000]);
  });
  it('returns empty for empty input or zero first price', () => {
    expect(rebase([])).toEqual([]);
    expect(rebase(pts(0, 5))).toEqual([]);
  });
});

describe('rankByReturn', () => {
  it('orders best first and assigns ranks', () => {
    const series: Series[] = [
      { symbol: 'A', points: pts(100, 105) },
      { symbol: 'B', points: pts(100, 120) },
      { symbol: 'C', points: pts(100, 90) },
    ];
    expect(rankByReturn(series).map((r) => [r.symbol, r.rank])).toEqual([
      ['B', 1],
      ['A', 2],
      ['C', 3],
    ]);
  });
  it('excludes series that are too short', () => {
    const series: Series[] = [
      { symbol: 'A', points: pts(100) },
      { symbol: 'B', points: pts(100, 101) },
    ];
    expect(rankByReturn(series).map((r) => r.symbol)).toEqual(['B']);
  });
});
