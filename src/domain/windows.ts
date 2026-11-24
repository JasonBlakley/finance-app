import type { TimeWindow } from './types';

export interface WindowConfig {
  label: string;
  /** Yahoo chart interval. Intraday intervals are only available for recent data. */
  interval: '5m' | '30m' | '1d';
  /** How far back to request. DAY asks for several days so a weekend still yields the last session. */
  lookbackDays: number;
  /** DAY keeps only the most recent trading session. */
  lastSessionOnly: boolean;
}

export const WINDOWS: Record<TimeWindow, WindowConfig> = {
  DAY: { label: 'Current day', interval: '5m', lookbackDays: 5, lastSessionOnly: true },
  WEEK: { label: 'Last 7 days', interval: '30m', lookbackDays: 7, lastSessionOnly: false },
  QUARTER: { label: 'Last quarter', interval: '1d', lookbackDays: 92, lastSessionOnly: false },
};

export const TIME_WINDOWS = Object.keys(WINDOWS) as TimeWindow[];

export function isTimeWindow(value: unknown): value is TimeWindow {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(WINDOWS, value);
}
