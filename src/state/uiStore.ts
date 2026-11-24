import { create } from 'zustand';
import { COMPANY_SYMBOLS } from '../config/companies';
import type { TimeWindow } from '../domain';

interface UiState {
  selectedWindow: TimeWindow;
  /** Symbols shown on the dashboard. IBM plus up to four competitors by default. */
  symbols: string[];
  setWindow: (window: TimeWindow) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedWindow: 'DAY',
  symbols: COMPANY_SYMBOLS,
  setWindow: (selectedWindow) => set({ selectedWindow }),
}));

/** Test helper: restore defaults between tests. */
export function resetUiStore(): void {
  useUiStore.setState({ selectedWindow: 'DAY', symbols: COMPANY_SYMBOLS });
}
