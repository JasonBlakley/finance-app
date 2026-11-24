import type { ErrorCode, ErrorInfo } from '../domain';

export class AppError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

/** Convert anything thrown into a safe, displayable shape. Never leaks raw upstream details. */
export function toErrorInfo(error: unknown): ErrorInfo {
  if (error instanceof AppError) return { code: error.code, message: error.message };
  return { code: 'NETWORK_ERROR', message: 'Something went wrong while loading market data.' };
}
