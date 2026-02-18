export const resolveErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const maybeError = error as Record<string, unknown>;
    if (typeof maybeError.message === 'string' && maybeError.message) {
      return maybeError.message;
    }
  }

  return String(error);
};

export const createRetryAt = (delayMs: number): Date =>
  new Date(Date.now() + delayMs);
