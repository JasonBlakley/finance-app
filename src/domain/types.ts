export type TimeWindow = 'DAY' | 'WEEK' | 'QUARTER';

export interface Company {
  symbol: string;
  name: string;
}

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  currency: string;
}

export interface PricePoint {
  /** Epoch milliseconds. */
  t: number;
  close: number;
}

export interface Series {
  symbol: string;
  points: PricePoint[];
}

export type ErrorCode =
  | 'INVALID_REQUEST'
  | 'INVALID_SYMBOL'
  | 'SYMBOL_NOT_FOUND'
  | 'NO_DATA'
  | 'RATE_LIMITED'
  | 'UPSTREAM_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'BAD_RESPONSE';

export interface ErrorInfo {
  code: ErrorCode;
  message: string;
}

/** Per-symbol outcome, so one failing symbol never blanks the whole dashboard. */
export type SymbolResult<T> =
  | { symbol: string; status: 'ok'; data: T }
  | { symbol: string; status: 'error'; error: ErrorInfo };
