import { describe, expect, it } from 'vitest';
import { MAX_SYMBOLS, SymbolValidationError, isValidSymbol, parseSymbols } from './symbols';
import { WINDOWS, TIME_WINDOWS, isTimeWindow } from './windows';

describe('isValidSymbol', () => {
  it.each(['IBM', 'BRK-B', 'BRK.B', '^GSPC', 'EURUSD=X'])('accepts %s', (s) => {
    expect(isValidSymbol(s)).toBe(true);
  });
  it.each(['', 'ibm', 'IB M', 'A;B', '<script>', 'WAYTOOLONGSYMBOL1', '-X'])('rejects %j', (s) => {
    expect(isValidSymbol(s)).toBe(false);
  });
});

describe('parseSymbols', () => {
  it('trims, upper-cases and de-duplicates', () => {
    expect(parseSymbols(' ibm, msft ,IBM')).toEqual(['IBM', 'MSFT']);
  });
  it('rejects empty input', () => {
    expect(() => parseSymbols('')).toThrow(SymbolValidationError);
    expect(() => parseSymbols(undefined)).toThrow(SymbolValidationError);
    expect(() => parseSymbols(' , ')).toThrow(SymbolValidationError);
  });
  it('rejects malformed symbols', () => {
    expect(() => parseSymbols('IBM,bad symbol')).toThrow(/Invalid symbol/);
  });
  it('rejects more than the maximum', () => {
    const many = Array.from({ length: MAX_SYMBOLS + 1 }, (_, i) => `S${i}`).join(',');
    expect(() => parseSymbols(many)).toThrow(/At most/);
  });
});

describe('windows', () => {
  it('defines the three required views', () => {
    expect(TIME_WINDOWS).toEqual(['DAY', 'WEEK', 'QUARTER']);
    expect(WINDOWS.QUARTER.lookbackDays).toBeGreaterThanOrEqual(90);
  });
  it('type-guards window values', () => {
    expect(isTimeWindow('DAY')).toBe(true);
    expect(isTimeWindow('YEAR')).toBe(false);
    expect(isTimeWindow('toString')).toBe(false);
    expect(isTimeWindow(undefined)).toBe(false);
  });
});
