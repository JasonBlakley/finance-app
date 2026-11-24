import { LineChart, ScaleTypes } from '@carbon/charts-react';
import type { ChartDatum } from '../../domain';

interface Props {
  data: ChartDatum[];
  /** Accessible description of what the chart shows. */
  label: string;
  /** Stable group -> colour mapping so each company keeps its colour across views. */
  colors: Record<string, string>;
}

/** The only component that imports the chart library, so the library can be swapped in one place. */
export function LineChartPanel({ data, label, colors }: Props) {
  return (
    <div role="img" aria-label={label}>
      <LineChart
        data={data}
        options={{
          title: '',
          height: '360px',
          axes: {
            bottom: { mapsTo: 'date', title: 'Time', scaleType: ScaleTypes.TIME },
            // Values are indexed to 100, so a zero baseline only flattens the lines.
            left: {
              mapsTo: 'value',
              title: 'Indexed price (start = 100)',
              scaleType: ScaleTypes.LINEAR,
              includeZero: false,
            },
          },
          // A sum of indexed prices is meaningless.
          tooltip: { showTotal: false },
          curve: 'curveMonotoneX',
          points: { enabled: false },
          color: { scale: colors },
          legend: { clickable: true },
        }}
      />
    </div>
  );
}
