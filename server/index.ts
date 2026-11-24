import { MockProvider } from '../src/services/mockProvider';
import { createApp } from './app';
import { YahooAdapter } from './yahooAdapter';

const port = Number(process.env.PORT ?? 8787);
const useMock = process.env.SERVER_DATA_SOURCE === 'mock';

const app = createApp(useMock ? new MockProvider() : new YahooAdapter());

app.listen(port, () => {
  console.log(`Market data proxy listening on http://localhost:${port} (${useMock ? 'mock' : 'yahoo'} data)`);
});
