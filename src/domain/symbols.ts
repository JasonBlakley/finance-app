/** Shared by the UI and the proxy so both enforce identical rules. */
export const MAX_SYMBOLS = 5;

const SYMBOL_PATTERN = /^[A-Z0-9^][A-Z0-9.\-^=]{0,11}$/;

export function isValidSymbol(value: string): boolean {
  return SYMBOL_PATTERN.test(value);
}

export class SymbolValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SymbolValidationError';
  }
}

/**
 * Parse a comma separated symbol list: trims, upper-cases, de-duplicates and validates.
 * Throws SymbolValidationError for empty, malformed or too many symbols.
 */
export function parseSymbols(raw: string | undefined | null): string[] {
  if (!raw || !raw.trim()) {
    throw new SymbolValidationError('At least one symbol is required.');
  }
  const symbols = [
    ...new Set(
      raw
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
    ),
  ];
  if (symbols.length === 0) {
    throw new SymbolValidationError('At least one symbol is required.');
  }
  if (symbols.length > MAX_SYMBOLS) {
    throw new SymbolValidationError(`At most ${MAX_SYMBOLS} symbols are allowed per request.`);
  }
  const bad = symbols.find((s) => !isValidSymbol(s));
  if (bad) {
    throw new SymbolValidationError(`Invalid symbol: ${bad.slice(0, 16)}`);
  }
  return symbols;
}
