import { HttpProvider } from './httpProvider';
import type { MarketDataProvider } from './MarketDataProvider';
import { MockProvider } from './mockProvider';

export type { MarketDataProvider } from './MarketDataProvider';
export { AppError, toErrorInfo } from './errors';

/** Chosen by VITE_DATA_SOURCE: "mock" for offline fixtures, anything else uses the proxy. */
export function createDefaultProvider(): MarketDataProvider {
  return import.meta.env.VITE_DATA_SOURCE === 'mock' ? new MockProvider(Date.now, 250) : new HttpProvider();
}
