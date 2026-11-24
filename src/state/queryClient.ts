import { QueryClient } from '@tanstack/react-query';
import { AppError } from '../services';

const NON_RETRYABLE = new Set(['INVALID_REQUEST', 'INVALID_SYMBOL', 'BAD_RESPONSE', 'RATE_LIMITED']);

/** Bounded retries (max 2) and never for errors a retry cannot fix. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) =>
          failureCount < 2 && !(error instanceof AppError && NON_RETRYABLE.has(error.code)),
        refetchOnWindowFocus: false,
      },
    },
  });
}
