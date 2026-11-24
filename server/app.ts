import express from 'express';
import type { Express, Response } from 'express';
import { SymbolValidationError, isTimeWindow, parseSymbols } from '../src/domain';
import type { ErrorInfo } from '../src/domain';
import type { MarketDataProvider } from '../src/services/MarketDataProvider';

function sendError(res: Response, status: number, error: ErrorInfo): void {
  res.status(status).json({ error });
}

function queryString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** Thin, read-only HTTP layer. All input is validated before it reaches the data source. */
export function createApp(source: MarketDataProvider): Express {
  const app = express();
  app.disable('x-powered-by');

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/quotes', async (req, res) => {
    let symbols: string[];
    try {
      symbols = parseSymbols(queryString(req.query.symbols));
    } catch (error) {
      if (error instanceof SymbolValidationError) {
        return sendError(res, 400, { code: 'INVALID_SYMBOL', message: error.message });
      }
      throw error;
    }
    try {
      res.json({ results: await source.getQuotes(symbols) });
    } catch {
      sendError(res, 502, { code: 'UPSTREAM_UNAVAILABLE', message: 'The market data provider is currently unavailable.' });
    }
  });

  app.get('/api/series', async (req, res) => {
    const window = queryString(req.query.window);
    if (!isTimeWindow(window)) {
      return sendError(res, 400, { code: 'INVALID_REQUEST', message: 'window must be one of DAY, WEEK, QUARTER.' });
    }
    let symbols: string[];
    try {
      symbols = parseSymbols(queryString(req.query.symbols));
    } catch (error) {
      if (error instanceof SymbolValidationError) {
        return sendError(res, 400, { code: 'INVALID_SYMBOL', message: error.message });
      }
      throw error;
    }
    try {
      res.json({ window, results: await source.getSeries(symbols, window) });
    } catch {
      sendError(res, 502, { code: 'UPSTREAM_UNAVAILABLE', message: 'The market data provider is currently unavailable.' });
    }
  });

  app.use('/api', (_req, res) => {
    sendError(res, 404, { code: 'INVALID_REQUEST', message: 'Unknown endpoint.' });
  });

  return app;
}
