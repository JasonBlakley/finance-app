import { describe, expect, it } from 'vitest';
import { formatPercent, formatPrice, formatSigned } from './format';

describe('format', () => {
  it('formats prices as currency', () => {
    expect(formatPrice(1234.5, 'USD')).toBe('$1,234.50');
  });
  it('falls back for invalid currency codes', () => {
    expect(formatPrice(12.3456, 'NOT A CODE')).toBe('12.35');
  });
  it('adds explicit signs', () => {
    expect(formatSigned(1.234)).toBe('+1.23');
    expect(formatSigned(-1.234)).toBe('\u22121.23');
    expect(formatSigned(0)).toBe('0.00');
    expect(formatPercent(-0.5)).toBe('\u22120.50%');
  });
});
