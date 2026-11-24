import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import type { ChartDatum } from '../domain';
import { MockProvider } from '../services/mockProvider';
import { resetUiStore, useUiStore } from '../state/uiStore';

// The real chart renders SVG via d3, which is brittle in jsdom. Assert on the props it receives instead.
vi.mock('../components/charts/LineChartPanel', () => ({
  LineChartPanel: (props: { data: ChartDatum[]; label: string }) => {
    const groups = [...new Set(props.data.map((d) => d.group))];
    return (
      <div data-testid="line-chart" aria-label={props.label}>
        {groups.join(',')}
      </div>
    );
  },
}));

const NOW = Date.UTC(2026, 0, 15, 20, 0, 0);

beforeEach(() => {
  resetUiStore();
});

async function submit(symbol: string) {
  const input = screen.getByLabelText('Ticker symbol');
  await userEvent.clear(input);
  if (symbol) await userEvent.type(input, symbol);
  await userEvent.click(screen.getByRole('button', { name: 'Show chart' }));
}

function customCalls(getSeries: { mock: { calls: unknown[][] } }) {
  return getSeries.mock.calls.filter((c) => (c[0] as string[]).length === 1);
}

describe('custom company store', () => {
  it('starts empty, sets and clears the symbol, and leaves the defaults alone', () => {
    expect(useUiStore.getState().customSymbol).toBeNull();
    useUiStore.getState().setCustomSymbol('AAPL');
    expect(useUiStore.getState().customSymbol).toBe('AAPL');
    expect(useUiStore.getState().symbols).toEqual(['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM']);
    useUiStore.getState().setCustomSymbol(null);
    expect(useUiStore.getState().customSymbol).toBeNull();
  });
});

describe('Custom company chart', () => {
  it('charts a valid symbol outside the default list and keeps the existing dashboard', async () => {
    render(<App provider={new MockProvider(() => NOW)} />);
    await screen.findByText('IBM,Microsoft,Oracle,SAP,Salesforce');

    await submit('aapl');

    expect(await screen.findByRole('region', { name: /AAPL: Current day price/ })).toBeInTheDocument();
    expect(await screen.findByText('AAPL', { selector: '[data-testid="line-chart"]' })).toBeInTheDocument();
    expect(screen.getByText('IBM,Microsoft,Oracle,SAP,Salesforce')).toBeInTheDocument();
    for (const symbol of ['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM']) {
      expect(screen.getByTestId(`quote-card-${symbol}`)).toBeInTheDocument();
    }
  });

  it.each([
    ['an empty value', ''],
    ['punctuation', '!!'],
    ['more than 12 characters', 'ABCDEFGHIJKLM'],
  ])('rejects %s with a message and sends no request', async (_name, value) => {
    const provider = new MockProvider(() => NOW);
    const getSeries = vi.spyOn(provider, 'getSeries');
    render(<App provider={provider} />);
    await screen.findByText('IBM,Microsoft,Oracle,SAP,Salesforce');

    await submit(value);

    expect(await screen.findByText(/ticker symbol|Use letters/i, { selector: '.cds--form-requirement' }))
      .toBeInTheDocument();
    expect(customCalls(getSeries)).toHaveLength(0);
    expect(useUiStore.getState().customSymbol).toBeNull();
  });

  it('rejects a symbol that is already on the dashboard', async () => {
    render(<App provider={new MockProvider(() => NOW)} />);
    await screen.findByText('IBM,Microsoft,Oracle,SAP,Salesforce');
    await submit('ibm');
    expect(await screen.findByText('IBM is already shown on the dashboard.')).toBeInTheDocument();
  });

  it('shows a loading state while data is retrieved', async () => {
    render(<App provider={new MockProvider(() => NOW, 60)} />);
    await screen.findByText('IBM,Microsoft,Oracle,SAP,Salesforce', {}, { timeout: 2000 });
    await submit('AAPL');
    const card = await screen.findByRole('region', { name: /AAPL: Current day price/ });
    expect(card.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(await screen.findByText('AAPL', { selector: '[data-testid="line-chart"]' })).toBeInTheDocument();
  });

  it('shows an error panel with retry for an unknown symbol without affecting other dashboards', async () => {
    render(<App provider={new MockProvider(() => NOW)} />);
    await screen.findByText('IBM,Microsoft,Oracle,SAP,Salesforce');

    await submit('ZZZZ');

    expect(await screen.findByText('No market data found for ZZZZ.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Retry' }).length).toBeGreaterThan(0);
    expect(screen.getByText('IBM,Microsoft,Oracle,SAP,Salesforce')).toBeInTheDocument();
    expect(screen.getByTestId('quote-card-IBM')).toBeInTheDocument();
  });

  it('updates the selected company chart when the time window changes', async () => {
    const provider = new MockProvider(() => NOW);
    const getSeries = vi.spyOn(provider, 'getSeries');
    render(<App provider={provider} />);
    await screen.findByText('IBM,Microsoft,Oracle,SAP,Salesforce');
    await submit('AAPL');
    await screen.findByRole('region', { name: /AAPL: Current day price/ });

    await userEvent.click(screen.getByRole('tab', { name: 'Last 7 days' }));

    expect(await screen.findByRole('region', { name: /AAPL: Last 7 days price/ })).toBeInTheDocument();
    await waitFor(() =>
      expect(customCalls(getSeries).map((c) => c[1])).toEqual(expect.arrayContaining(['DAY', 'WEEK'])),
    );
  });
});
