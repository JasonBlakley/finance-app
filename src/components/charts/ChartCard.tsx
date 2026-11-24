import { SkeletonPlaceholder } from '@carbon/react';
import type { ReactNode } from 'react';
import type { ErrorInfo } from '../../domain';
import { ErrorPanel } from '../feedback/ErrorPanel';

interface Props {
  title: string;
  subtitle?: string;
  loading?: boolean;
  error?: ErrorInfo | null;
  empty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children?: ReactNode;
}

/** Generic frame with loading, error and empty slots. Knows nothing about charts or data. */
export function ChartCard({
  title,
  subtitle,
  loading,
  error,
  empty,
  emptyMessage = 'No data available for this view.',
  onRetry,
  children,
}: Props) {
  return (
    <section className="chart-card" aria-label={title}>
      <h2 className="chart-card__title">{title}</h2>
      {subtitle ? <p className="chart-card__subtitle">{subtitle}</p> : null}
      {loading ? (
        <div data-testid="chart-loading" aria-busy="true">
          <SkeletonPlaceholder className="chart-card__skeleton" />
        </div>
      ) : error ? (
        <ErrorPanel title="Unable to load chart" error={error} onRetry={onRetry} />
      ) : empty ? (
        <p className="chart-card__empty">{emptyMessage}</p>
      ) : (
        children
      )}
    </section>
  );
}
