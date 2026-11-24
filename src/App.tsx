import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AppErrorBoundary } from './components/layout/AppErrorBoundary';
import { DashboardPage } from './pages/DashboardPage';
import type { MarketDataProvider } from './services';
import { createDefaultProvider } from './services';
import { createQueryClient } from './state/queryClient';
import { ProviderContext } from './state/queries';

interface Props {
  /** Injected in tests; defaults to the provider selected by VITE_DATA_SOURCE. */
  provider?: MarketDataProvider;
}

export function App({ provider }: Props) {
  const [queryClient] = useState(createQueryClient);
  const [resolved] = useState(() => provider ?? createDefaultProvider());
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ProviderContext.Provider value={resolved}>
          <DashboardPage />
        </ProviderContext.Provider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
