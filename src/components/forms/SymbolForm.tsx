import { Button, TextInput } from '@carbon/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { validateSymbolInput } from '../../domain';

interface Props {
  /** Symbols already on the dashboard; these are rejected as duplicates. */
  alreadyShown: string[];
  /** Called only with a validated, upper-cased symbol. */
  onSubmit: (symbol: string) => void;
}

/** Validates locally so a malformed symbol never reaches the data provider. */
export function SymbolForm({ alreadyShown, onSubmit }: Props) {
  const [value, setValue] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = validateSymbolInput(value, alreadyShown);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setMessage(null);
    setValue(result.symbol);
    onSubmit(result.symbol);
  }

  return (
    <form className="symbol-form" onSubmit={handleSubmit} noValidate>
      <TextInput
        id="custom-symbol"
        labelText="Ticker symbol"
        placeholder="e.g. AAPL"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        invalid={message !== null}
        invalidText={message ?? ''}
      />
      <Button type="submit" kind="primary" size="md">
        Show chart
      </Button>
    </form>
  );
}
