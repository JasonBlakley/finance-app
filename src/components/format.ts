export function formatPrice(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  } catch {
    // Unknown currency code from upstream: fall back to a plain number.
    return value.toFixed(2);
  }
}

/** Signed so direction is clear without relying on colour alone. */
export function formatSigned(value: number, digits = 2): string {
  const sign = value > 0 ? '+' : value < 0 ? '\u2212' : '';
  return `${sign}${Math.abs(value).toFixed(digits)}`;
}

export function formatPercent(value: number): string {
  return `${formatSigned(value)}%`;
}
