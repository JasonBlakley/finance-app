import type { PricePoint, Series } from './types';

/** Percent change from `from` to `to`. Returns 0 when `from` is 0 or either value is not finite. */
export function percentChange(from: number, to: number): number {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from === 0) return 0;
  return ((to - from) / from) * 100;
}

/** Percent return across a series (first to last point). 0 for series with fewer than 2 points. */
export function periodReturn(points: PricePoint[]): number {
  if (points.length < 2) return 0;
  return percentChange(points[0].close, points[points.length - 1].close);
}

/** Rebase prices so the first point equals `base` (default 100), making different symbols comparable. */
export function rebase(points: PricePoint[], base = 100): PricePoint[] {
  if (points.length === 0 || points[0].close === 0) return [];
  const first = points[0].close;
  return points.map((p) => ({ t: p.t, close: (p.close / first) * base }));
}

export interface RankedReturn {
  symbol: string;
  returnPercent: number;
  rank: number;
}

/** Rank series by period return, best first. Series with fewer than 2 points are excluded. */
export function rankByReturn(series: Series[]): RankedReturn[] {
  return series
    .filter((s) => s.points.length >= 2)
    .map((s) => ({ symbol: s.symbol, returnPercent: periodReturn(s.points) }))
    .sort((a, b) => b.returnPercent - a.returnPercent)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
