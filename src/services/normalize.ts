import { WINDOWS } from '../domain';
import type { PricePoint, TimeWindow } from '../domain';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Loosely typed upstream candle. Yahoo returns Dates; JSON may carry numbers or strings. */
export interface RawPoint {
  date?: Date | number | string | null;
  close?: number | null;
}

/** Drop incomplete candles, sort by time and de-duplicate timestamps (last one wins). */
export function normalizePoints(raw: RawPoint[]): PricePoint[] {
  const byTime = new Map<number, number>();
  for (const r of raw) {
    if (r.date == null || r.close == null) continue;
    const t = typeof r.date === 'number' ? r.date : new Date(r.date).getTime();
    if (!Number.isFinite(t) || !Number.isFinite(r.close)) continue;
    byTime.set(t, r.close);
  }
  return [...byTime.entries()].sort((a, b) => a[0] - b[0]).map(([t, close]) => ({ t, close }));
}

/**
 * Trim points to the requested window, anchored on the latest data point rather than "now"
 * so weekends and holidays still show the most recent session.
 *  - DAY: only the last trading session (same UTC calendar date as the latest point).
 *  - WEEK / QUARTER: the trailing lookback period.
 */
export function applyWindow(points: PricePoint[], window: TimeWindow): PricePoint[] {
  if (points.length === 0) return [];
  const last = points[points.length - 1].t;
  const config = WINDOWS[window];
  if (config.lastSessionOnly) {
    const day = new Date(last).toISOString().slice(0, 10);
    return points.filter((p) => new Date(p.t).toISOString().slice(0, 10) === day);
  }
  const cutoff = last - config.lookbackDays * DAY_MS;
  return points.filter((p) => p.t >= cutoff);
}
