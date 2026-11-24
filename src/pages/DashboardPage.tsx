import { Suspense, lazy, useMemo } from 'react';
import { COMPANY_COLORS, companyName } from '../config/companies';
import { WINDOWS, rankByReturn, toChartData } from '../domain';
import type { ErrorInfo, Series, SymbolResult } from '../domain';
import { toErrorInfo } from '../services';
import { useQuotes, useSeries } from '../state/queries';
import { useUiStore } from '../state/uiStore';
import { QuoteCard } from '../components/cards/QuoteCard';
import { ChartCard } from '../components/charts/ChartCard';
import { RankingTable } from '../components/charts/RankingTable';
import { PartialDataBanner } from '../components/feedback/PartialDataBanner';
import { TimeWindowTabs } from '../components/layout/TimeWindowTabs';
import { CustomCompanySection } from './CustomCompanySection';

// Carbon Charts and d3 are large; load them after the first paint.
const LineChartPanel = lazy(() =>
  import('../components/charts/LineChartPanel').then((m) => ({ default: m.LineChartPanel })),
);

function failures<T>(results: SymbolResult<T>[] | undefined) {
  return (results ?? []).flatMap((r) =>
    r.status === 'error' ? [{ symbol: r.symbol, message: r.error.message }] : [],
  );
}

export function DashboardPage() {
  const window = useUiStore((s) => s.selectedWindow);
  const symbols = useUiStore((s) => s.symbols);
  const setWindow = useUiStore((s) => s.setWindow);

  const quotes = useQuotes(symbols);
  const series = useSeries(symbols, window);

  const okSeries = useMemo<Series[]>(
    () => (series.data ?? []).flatMap((r) => (r.status === 'ok' ? [r.data] : [])),
    [series.data],
  );
  const chartData = useMemo(() => toChartData(okSeries, companyName), [okSeries]);
  const ranking = useMemo(() => rankByReturn(okSeries), [okSeries]);

  const seriesError: ErrorInfo | null = series.error ? toErrorInfo(series.error) : null;
  const quotesError: ErrorInfo | null = quotes.error ? toErrorInfo(quotes.error) : null;
  const failed = failures(series.data);
  const label = WINDOWS[window].label;

  return (
    <main className="dashboard">
      <header className="dashboard__header">
        <h1>IBM market dashboard</h1>
        <p>IBM compared with up to four competitors.</p>
        <TimeWindowTabs value={window} onChange={setWindow} />
      </header>

      {window === 'DAY' ? (
        <section aria-label="Current day quotes" className="quote-grid">
          {quotesError ? (
            <ChartCard
              title="Quotes"
              error={quotesError}
              onRetry={() => void quotes.refetch()}
            />
          ) : (
            symbols.map((symbol) => {
              const result = quotes.data?.find((r) => r.symbol === symbol);
              return (
                <QuoteCard
                  key={symbol}
                  symbol={symbol}
                  name={companyName(symbol)}
                  loading={quotes.isPending}
                  quote={result?.status === 'ok' ? result.data : undefined}
                  error={result?.status === 'error' ? result.error : undefined}
                  highlight={symbol === 'IBM'}
                />
              );
            })
          )}
        </section>
      ) : null}

      <PartialDataBanner failed={failed} />

      <ChartCard
        title={`${label}: relative performance`}
        subtitle="Each company is indexed to 100 at the start of the period."
        loading={series.isPending}
        error={seriesError}
        empty={chartData.length === 0}
        emptyMessage="No chart data is available for this period."
        onRetry={() => void series.refetch()}
      >
        <Suspense fallback={<div data-testid="chart-loading" aria-busy="true" />}>
          <LineChartPanel
            data={chartData}
            colors={COMPANY_COLORS}
            label={`${label} relative price performance for ${symbols.join(', ')}`}
          />
        </Suspense>
      </ChartCard>

      {window !== 'DAY' && ranking.length > 0 ? (
        <RankingTable rows={ranking} label={companyName} caption={`${label}: ranking by return`} />
      ) : null}

      <CustomCompanySection window={window} />
    </main>
  );
}
