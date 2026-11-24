import { Button, InlineNotification } from '@carbon/react';
import type { ErrorInfo } from '../../domain';

interface Props {
  title: string;
  error: ErrorInfo;
  onRetry?: () => void;
}

export function ErrorPanel({ title, error, onRetry }: Props) {
  return (
    <div className="error-panel">
      <InlineNotification
        kind="error"
        role="alert"
        title={title}
        subtitle={error.message}
        hideCloseButton
        lowContrast
      />
      {onRetry ? (
        <Button kind="tertiary" size="sm" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
