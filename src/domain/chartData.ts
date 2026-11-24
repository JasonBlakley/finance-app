import { rebase } from './metrics';
import type { Series } from './types';

/** One row in the shape Carbon Charts expects for a line chart. */
export interface ChartDatum {
  group: string;
  date: Date;
  value: number;
}

/**
 * Convert series into chart rows, rebased to 100 so symbols with very different
 * share prices can be compared on a single axis.
 */
export function toChartData(series: Series[], label: (symbol: string) => string): ChartDatum[] {
  return series.flatMap((s) =>
    rebase(s.points).map((p) => ({ group: label(s.symbol), date: new Date(p.t), value: p.close })),
  );
}
