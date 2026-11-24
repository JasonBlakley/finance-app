import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import type { ChartDatum } from '../domain';
import { AppError } from '../services';
import type { MarketDataProvider } from '../services';
import { MockProvider } from '../services/mockProvider';
import { resetUiStore } from '../state/uiStore';

// The real chart renders SVG via d3, which is brittle in jsdom. Assert on the props it receives instead.
const chartSpy = vi.fn();
vi.mock('../components/charts/LineChartPanel', () => ({
  LineChartPanel: (props: { data: ChartDatum[]; label: string }) => {
    chartSpy(props);
    const groups = [...new Set(props.data.map((d) => d.group))];
    return <div data-testid="line-chart" aria-label={props.label}>{groups.join(',')}</div>;
  },
}));

const NOW = Date.UTC(2026, 0, 15, 20, 0, 0);

beforeEach(() => {
  chartSpy.mockClear();
  resetUiStore();
});

describe('Dashboard', () => {
  it('shows five company quote cards on the current-day view', async () => {
    render(<App provider={new MockProvider(() => NOW)} />);
    for (const symbol of ['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM']) {
      expect(await screen.findByTestId(`quote-card-${symbol}`)).toBeInTheDocument();
    }
    const ibm = screen.getByTestId('quote-card-IBM');
    await waitFor(() => expect(within(ibm).getByText(/^\$/)).toBeInTheDocument());
  });

  it('renders the comparison chart for all five companies', async () => {
    render(<App provider={new MockProvider(() => NOW)} />);
    const chart = await screen.findByTestId('line-chart');
    expect(chart).toHaveTextContent('IBM,Microsoft,Oracle,SAP,Salesforce');
  });

  it('switches to the 7-day and quarter views and shows a ranking table', async () => {
    const provider = new MockProvider(() => NOW);
    const getSeries = vi.spyOn(provider, 'getSeries');
    render(<App provider={provider} />);
    await screen.findByTestId('line-chart');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Last 7 days' }));
    expect(await screen.findByRole('table', { name: /Last 7 days: ranking by return/ })).toBeInTheDocument();
    expect(screen.queryByTestId('quote-card-IBM')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Last quarter' }));
    expect(await screen.findByRole('table', { name: /Last quarter: ranking by return/ })).toBeInTheDocument();

    const windows = getSeries.mock.calls.map((c) => c[1]);
    expect(windows).toEqual(expect.arrayContaining(['DAY', 'WEEK', 'QUARTER']));
  });

  it('keeps working when one symbol fails and shows a partial-data banner', async () => {
    const base = new MockProvider(() => NOW);
    // The mock treats ZZZZ as unknown; present that failure to the UI as SAP.
    const swap = (symbols: string[]) => symbols.map((s) => (s === 'SAP' ? 'ZZZZ' : s));
    const restore = <T extends { symbol: string }>(results: T[]): T[] =>
      results.map((r) => (r.symbol === 'ZZZZ' ? { ...r, symbol: 'SAP' } : r));
    const provider: MarketDataProvider = {
      getQuotes: async (symbols, signal) => restore(await base.getQuotes(swap(symbols), signal)),
      getSeries: async (symbols, window, signal) =>
        restore(await base.getSeries(swap(symbols), window, signal)),
    };
    render(<App provider={provider} />);
    expect(await screen.findByText(/Partial data/)).toBeInTheDocument();
    expect(await screen.findByTestId('line-chart')).toHaveTextContent('IBM,Microsoft,Oracle,Salesforce');
    expect(await within(screen.getByTestId('quote-card-SAP')).findByText(/Unavailable/)).toBeInTheDocument();
    expect(await within(screen.getByTestId('quote-card-IBM')).findByText(/^\$/)).toBeInTheDocument();
  });

  it('shows an error panel with retry when the whole request fails, then recovers', async () => {
    const base = new MockProvider(() => NOW);
    let failing = true;
    const provider: MarketDataProvider = {
      getQuotes: base.getQuotes.bind(base),
      getSeries: (symbols, window, signal) =>
        failing
          ? Promise.reject(new AppError('RATE_LIMITED', 'Rate limited by provider.'))
          : base.getSeries(symbols, window, signal),
    };
    render(<App provider={provider} />);
    expect(await screen.findByText('Rate limited by provider.')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();

    failing = false;
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByTestId('line-chart')).toBeInTheDocument();
  });
});
