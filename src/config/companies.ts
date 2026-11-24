import type { Company } from '../domain';

export interface CompanyConfig extends Company {
  /** Stable chart colour so each company looks the same in every view. */
  color: string;
}

/** IBM is always first. Add or remove competitors here; the list must stay within MAX_SYMBOLS. */
export const COMPANIES: CompanyConfig[] = [
  { symbol: 'IBM', name: 'IBM', color: '#0f62fe' },
  { symbol: 'MSFT', name: 'Microsoft', color: '#fa4d56' },
  { symbol: 'ORCL', name: 'Oracle', color: '#198038' },
  { symbol: 'SAP', name: 'SAP', color: '#b28600' },
  { symbol: 'CRM', name: 'Salesforce', color: '#8a3ffc' },
];

export const COMPANY_SYMBOLS = COMPANIES.map((c) => c.symbol);

export function companyName(symbol: string): string {
  return COMPANIES.find((c) => c.symbol === symbol)?.name ?? symbol;
}

/** Colour scale keyed by display name, which is what the chart groups by. */
export const COMPANY_COLORS: Record<string, string> = Object.fromEntries(
  COMPANIES.map((c) => [c.name, c.color]),
);
