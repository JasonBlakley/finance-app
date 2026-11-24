import { createContext, useContext } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { TimeWindow } from '../domain';
import type { MarketDataProvider } from '../services';

export const ProviderContext = createContext<MarketDataProvider | null>(null);

export function useProvider(): MarketDataProvider {
  const provider = useContext(ProviderContext);
  if (!provider) throw new Error('useProvider must be used inside <ProviderContext.Provider>.');
  return provider;
}

/** Quotes refresh every minute while the tab is visible. */
const QUOTE_STALE_MS = 30_000;
const SERIES_STALE_MS: Record<TimeWindow, number> = {
  DAY: 60_000,
  WEEK: 5 * 60_000,
  QUARTER: 15 * 60_000,
};

export function useQuotes(symbols: string[]) {
  const provider = useProvider();
  return useQuery({
    queryKey: ['quotes', symbols],
    queryFn: ({ signal }) => provider.getQuotes(symbols, signal),
    staleTime: QUOTE_STALE_MS,
    refetchInterval: 60_000,
  });
}

export function useSeries(symbols: string[], window: TimeWindow) {
  const provider = useProvider();
  return useQuery({
    queryKey: ['series', window, symbols],
    queryFn: ({ signal }) => provider.getSeries(symbols, window, signal),
    staleTime: SERIES_STALE_MS[window],
    placeholderData: keepPreviousData,
  });
}
