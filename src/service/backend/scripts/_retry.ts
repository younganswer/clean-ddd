export type RetryOptions = {
  attempts: number;
  delayMs: number;
  label?: string;
};

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetries<T>(
  options: RetryOptions,
  fn: (attempt: number) => Promise<T>,
): Promise<T> {
  const { attempts, delayMs, label } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      const prefix = label ? `[${label}] ` : '';
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (attempt >= attempts) {
        break;
      }

      // eslint-disable-next-line no-console
      const delaySeconds = Math.max(0, Math.round(delayMs / 1000));
      console.warn(
        `${prefix}시도 ${attempt}/${attempts} 실패: ${errorMessage} (${delaySeconds}초 후 재시도)`,
      );
      await sleep(delayMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
