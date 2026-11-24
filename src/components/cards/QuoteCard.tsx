import { SkeletonText, Tile } from '@carbon/react';
import type { ErrorInfo, Quote } from '../../domain';
import { formatPercent, formatPrice, formatSigned } from '../format';

interface Props {
  symbol: string;
  name: string;
  /** Undefined while the first load is in flight. */
  quote?: Quote;
  error?: ErrorInfo;
  loading?: boolean;
  highlight?: boolean;
}

export function QuoteCard({ symbol, name, quote, error, loading, highlight }: Props) {
  const direction = quote ? Math.sign(quote.change) : 0;
  return (
    <Tile
      className={`quote-card${highlight ? ' quote-card--highlight' : ''}`}
      data-testid={`quote-card-${symbol}`}
    >
      <p className="quote-card__symbol">
        {symbol}
        {name !== symbol && <span className="quote-card__name"> {name}</span>}
      </p>
      {loading && !quote && !error ? (
        <SkeletonText heading width="60%" />
      ) : error ? (
        <p className="quote-card__error" role="status">
          Unavailable: {error.message}
        </p>
      ) : quote ? (
        <>
          <p className="quote-card__price">{formatPrice(quote.price, quote.currency)}</p>
          <p
            className={`quote-card__change${direction > 0 ? ' is-up' : direction < 0 ? ' is-down' : ''}`}
          >
            {formatSigned(quote.change)} ({formatPercent(quote.changePercent)})
          </p>
        </>
      ) : null}
    </Tile>
  );
}
