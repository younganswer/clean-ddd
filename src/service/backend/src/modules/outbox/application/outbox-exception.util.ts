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

const DEFAULT_OUTBOX_MAX_ATTEMPTS = 10;

export const resolveOutboxMaxAttempts = (
	raw: string | number | undefined,
	fallback = DEFAULT_OUTBOX_MAX_ATTEMPTS,
): number => {
	if (typeof raw === 'number') {
		const normalized = Math.trunc(raw);
		if (Number.isFinite(normalized) && normalized >= 1) {
			return normalized;
		}
		return fallback;
	}

	if (typeof raw === 'string') {
		const trimmed = raw.trim();
		if (!trimmed) return fallback;

		const parsed = Number.parseInt(trimmed, 10);
		if (Number.isFinite(parsed) && parsed >= 1) {
			return parsed;
		}
	}

	return fallback;
};
