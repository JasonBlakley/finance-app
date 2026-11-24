import { InlineNotification } from '@carbon/react';

export interface FailedSymbol {
  symbol: string;
  message: string;
}

/** Shown when some, but not all, symbols failed: the rest of the dashboard keeps working. */
export function PartialDataBanner({ failed }: { failed: FailedSymbol[] }) {
  if (failed.length === 0) return null;
  return (
    <InlineNotification
      kind="warning"
      role="status"
      title="Partial data"
      subtitle={failed.map((f) => `${f.symbol}: ${f.message}`).join(' ')}
      hideCloseButton
      lowContrast
    />
  );
}
