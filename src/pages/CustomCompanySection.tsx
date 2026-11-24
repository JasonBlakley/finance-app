import { Suspense, lazy, useMemo } from 'react';
import { COMPANY_COLORS, companyName } from '../config/companies';
import { WINDOWS, toChartData } from '../domain';
import type { ErrorInfo, TimeWindow } from '../domain';
import { toErrorInfo } from '../services';
import { useCustomSeries } from '../state/queries';
import { useUiStore } from '../state/uiStore';
import { ChartCard } from '../components/charts/ChartCard';
import { SymbolForm } from '../components/forms/SymbolForm';

const LineChartPanel = lazy(() =>
  import('../components/charts/LineChartPanel').then((m) => ({ default: m.LineChartPanel })),
);

interface Props {
  window: TimeWindow;
}

/** An extra chart for one user-selected company. Independent of the default comparison above it. */
export function CustomCompanySection({ window }: Props) {
  const defaults = useUiStore((s) => s.symbols);
  const customSymbol = useUiStore((s) => s.customSymbol);
  const setCustomSymbol = useUiStore((s) => s.setCustomSymbol);
  const query = useCustomSeries(customSymbol, window);

  const result = query.data?.[0];
  const points = result?.status === 'ok' ? result.data : null;
  const chartData = useMemo(
    () => (points ? toChartData([points], companyName) : []),
    [points],
  );

  const error: ErrorInfo | null = query.error
    ? toErrorInfo(query.error)
    : result?.status === 'error'
      ? result.error
      : null;
  const label = WINDOWS[window].label;

  return (
    <section aria-label="Compare another company" className="custom-company">
      <h2>Look up another company</h2>
      <SymbolForm alreadyShown={defaults} onSubmit={setCustomSymbol} />
      {customSymbol ? (
        <ChartCard
          title={`${customSymbol}: ${label} price`}
          subtitle="Indexed to 100 at the start of the period."
          loading={query.isFetching && !points}
          error={error}
          empty={chartData.length === 0}
          emptyMessage={`No chart data is available for ${customSymbol} in this period.`}
          onRetry={() => void query.refetch()}
        >
          <Suspense fallback={<div data-testid="chart-loading" aria-busy="true" />}>
            <LineChartPanel
              data={chartData}
              colors={COMPANY_COLORS}
              label={`${label} price performance for ${customSymbol}`}
            />
          </Suspense>
        </ChartCard>
      ) : null}
    </section>
  );
}
