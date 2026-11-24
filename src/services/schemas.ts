import { z } from 'zod';

/** Wire format shared by the proxy (server/) and HttpProvider. Validated on both sides of the wire. */

export const errorInfoSchema = z.object({
  code: z.enum([
    'INVALID_REQUEST',
    'INVALID_SYMBOL',
    'SYMBOL_NOT_FOUND',
    'NO_DATA',
    'RATE_LIMITED',
    'UPSTREAM_UNAVAILABLE',
    'NETWORK_ERROR',
    'BAD_RESPONSE',
  ]),
  message: z.string(),
});

const quoteSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  previousClose: z.number(),
  change: z.number(),
  changePercent: z.number(),
  currency: z.string(),
});

const seriesSchema = z.object({
  symbol: z.string(),
  points: z.array(z.object({ t: z.number(), close: z.number() })),
});

function resultSchema<T extends z.ZodType>(data: T) {
  return z.discriminatedUnion('status', [
    z.object({ symbol: z.string(), status: z.literal('ok'), data }),
    z.object({ symbol: z.string(), status: z.literal('error'), error: errorInfoSchema }),
  ]);
}

export const quotesResponseSchema = z.object({ results: z.array(resultSchema(quoteSchema)) });
export const seriesResponseSchema = z.object({
  window: z.enum(['DAY', 'WEEK', 'QUARTER']),
  results: z.array(resultSchema(seriesSchema)),
});

/** Error body returned for whole-request failures (HTTP 4xx/5xx). */
export const errorResponseSchema = z.object({ error: errorInfoSchema });
