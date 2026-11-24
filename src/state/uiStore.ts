import { create } from 'zustand';
import { COMPANY_SYMBOLS } from '../config/companies';
import type { TimeWindow } from '../domain';

interface UiState {
  selectedWindow: TimeWindow;
  /** Symbols shown on the dashboard. IBM plus up to four competitors by default. */
  symbols: string[];
  /** One extra, user-selected symbol charted separately from the default comparison. */
  customSymbol: string | null;
  setWindow: (window: TimeWindow) => void;
  setCustomSymbol: (symbol: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedWindow: 'DAY',
  symbols: COMPANY_SYMBOLS,
  customSymbol: null,
  setWindow: (selectedWindow) => set({ selectedWindow }),
  setCustomSymbol: (customSymbol) => set({ customSymbol }),
}));

/** Test helper: restore defaults between tests. */
export function resetUiStore(): void {
  useUiStore.setState({ selectedWindow: 'DAY', symbols: COMPANY_SYMBOLS, customSymbol: null });
}
