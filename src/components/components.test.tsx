import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QuoteCard } from './cards/QuoteCard';
import { ChartCard } from './charts/ChartCard';
import { RankingTable } from './charts/RankingTable';
import { PartialDataBanner } from './feedback/PartialDataBanner';
import { TimeWindowTabs } from './layout/TimeWindowTabs';

const quote = {
  symbol: 'IBM',
  name: 'IBM',
  price: 210.5,
  previousClose: 200,
  change: 10.5,
  changePercent: 5.25,
  currency: 'USD',
};

describe('QuoteCard', () => {
  it('shows price and signed change', () => {
    render(<QuoteCard symbol="IBM" name="IBM" quote={quote} />);
    expect(screen.getByText('$210.50')).toBeInTheDocument();
    expect(screen.getByText('+10.50 (+5.25%)')).toBeInTheDocument();
  });

  it('shows a per-symbol error without hiding the card', () => {
    render(
      <QuoteCard
        symbol="SAP"
        name="SAP"
        error={{ code: 'SYMBOL_NOT_FOUND', message: 'No market data found for SAP.' }}
      />,
    );
    expect(screen.getByText(/No market data found for SAP/)).toBeInTheDocument();
  });
});

describe('ChartCard', () => {
  it('renders children when ready', () => {
    render(
      <ChartCard title="T">
        <p>chart body</p>
      </ChartCard>,
    );
    expect(screen.getByText('chart body')).toBeInTheDocument();
  });

  it('renders a loading placeholder instead of children', () => {
    render(
      <ChartCard title="T" loading>
        <p>chart body</p>
      </ChartCard>,
    );
    expect(screen.getByTestId('chart-loading')).toBeInTheDocument();
    expect(screen.queryByText('chart body')).not.toBeInTheDocument();
  });

  it('renders an error with a working retry button', async () => {
    const onRetry = vi.fn();
    render(
      <ChartCard title="T" error={{ code: 'NETWORK_ERROR', message: 'Down.' }} onRetry={onRetry} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Down.');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renders the empty message', () => {
    render(<ChartCard title="T" empty emptyMessage="Nothing here." />);
    expect(screen.getByText('Nothing here.')).toBeInTheDocument();
  });
});

describe('PartialDataBanner', () => {
  it('renders nothing when there are no failures', () => {
    const { container } = render(<PartialDataBanner failed={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists failed symbols', () => {
    render(<PartialDataBanner failed={[{ symbol: 'SAP', message: 'Unavailable.' }]} />);
    expect(screen.getByText(/SAP: Unavailable\./)).toBeInTheDocument();
  });
});

describe('RankingTable', () => {
  it('shows ranked rows with signed returns', () => {
    render(
      <RankingTable
        caption="Ranking"
        label={(s) => s}
        rows={[
          { symbol: 'IBM', returnPercent: 4.2, rank: 1 },
          { symbol: 'MSFT', returnPercent: -1.1, rank: 2 },
        ]}
      />,
    );
    expect(screen.getByText('+4.20%')).toBeInTheDocument();
    expect(screen.getByText('\u22121.10%')).toBeInTheDocument();
  });
});

describe('TimeWindowTabs', () => {
  it('lists all three windows and reports selection changes', async () => {
    const onChange = vi.fn();
    render(<TimeWindowTabs value="DAY" onChange={onChange} />);
    expect(screen.getByRole('tab', { name: 'Current day' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Last 7 days' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Last quarter' }));
    expect(onChange).toHaveBeenCalledWith('QUARTER');
  });
});
