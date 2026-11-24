import { describe, expect, it } from 'vitest';
import { toChartData } from './chartData';

describe('toChartData', () => {
  it('rebases each series to 100 and labels the group', () => {
    const rows = toChartData(
      [
        { symbol: 'IBM', points: [{ t: 1000, close: 200 }, { t: 2000, close: 210 }] },
        { symbol: 'MSFT', points: [{ t: 1000, close: 400 }, { t: 2000, close: 380 }] },
      ],
      (s) => (s === 'IBM' ? 'IBM' : 'Microsoft'),
    );
    expect(rows).toHaveLength(4);
    expect(rows[0]).toEqual({ group: 'IBM', date: new Date(1000), value: 100 });
    expect(rows[1].value).toBeCloseTo(105);
    expect(rows[3]).toMatchObject({ group: 'Microsoft' });
    expect(rows[3].value).toBeCloseTo(95);
  });

  it('skips series that cannot be rebased', () => {
    expect(toChartData([{ symbol: 'X', points: [] }], (s) => s)).toEqual([]);
  });
});
