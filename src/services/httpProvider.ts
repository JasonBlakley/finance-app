import { z } from 'zod';
import type { ErrorCode, Quote, Series, SymbolResult, TimeWindow } from '../domain';
import { AppError } from './errors';
import type { MarketDataProvider } from './MarketDataProvider';
import { errorResponseSchema, quotesResponseSchema, seriesResponseSchema } from './schemas';

const DEFAULT_TIMEOUT_MS = 10_000;

function codeForStatus(status: number): ErrorCode {
  if (status === 400) return 'INVALID_REQUEST';
  if (status === 429) return 'RATE_LIMITED';
  return 'UPSTREAM_UNAVAILABLE';
}

export class HttpProvider implements MarketDataProvider {
  constructor(
    private readonly baseUrl = '/api',
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS,
  ) {}

  getQuotes(symbols: string[], signal?: AbortSignal): Promise<SymbolResult<Quote>[]> {
    const query = new URLSearchParams({ symbols: symbols.join(',') });
    return this.request(`/quotes?${query}`, quotesResponseSchema, signal).then((r) => r.results);
  }

  getSeries(
    symbols: string[],
    window: TimeWindow,
    signal?: AbortSignal,
  ): Promise<SymbolResult<Series>[]> {
    const query = new URLSearchParams({ symbols: symbols.join(','), window });
    return this.request(`/series?${query}`, seriesResponseSchema, signal).then((r) => r.results);
  }

  private async request<S extends z.ZodType>(
    path: string,
    schema: S,
    signal?: AbortSignal,
  ): Promise<z.infer<S>> {
    const timeout = AbortSignal.timeout(this.timeoutMs);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, { signal: combined });
    } catch (error) {
      // Caller cancelled (e.g. the user switched tabs): propagate so the query layer ignores it.
      if (signal?.aborted) throw error;
      const timedOut = timeout.aborted;
      throw new AppError(
        'NETWORK_ERROR',
        timedOut ? 'The market data request timed out.' : 'Unable to reach the market data service.',
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }

    if (!response.ok) {
      const parsed = errorResponseSchema.safeParse(body);
      if (parsed.success) throw new AppError(parsed.data.error.code, parsed.data.error.message);
      throw new AppError(codeForStatus(response.status), 'The market data service returned an error.');
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('BAD_RESPONSE', 'The market data service returned an unexpected response.');
    }
    return parsed.data;
  }
}
