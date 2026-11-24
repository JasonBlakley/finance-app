import { ContentSwitcher, Switch } from '@carbon/react';
import { TIME_WINDOWS, WINDOWS } from '../../domain';
import type { TimeWindow } from '../../domain';

interface Props {
  value: TimeWindow;
  onChange: (window: TimeWindow) => void;
}

/** Controlled and free of data logic; the page decides what a window change means. */
export function TimeWindowTabs({ value, onChange }: Props) {
  return (
    <ContentSwitcher
      size="md"
      selectedIndex={TIME_WINDOWS.indexOf(value)}
      onChange={({ index }) => {
        const next = typeof index === 'number' ? TIME_WINDOWS[index] : undefined;
        if (next) onChange(next);
      }}
    >
      {TIME_WINDOWS.map((window) => (
        <Switch key={window} name={window} text={WINDOWS[window].label} />
      ))}
    </ContentSwitcher>
  );
}
