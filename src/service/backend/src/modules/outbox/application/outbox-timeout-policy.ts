export interface OutboxTimeoutPolicy {
	lockTimeoutMs: number;
	visibilityTimeoutSeconds: number;
}

export interface ResolveOutboxTimeoutPolicyOptions {
	lockTimeoutRaw?: string;
	visibilityTimeoutSecondsRaw?: string;
	defaultLockTimeoutMs: number;
	defaultVisibilityTimeoutSeconds: number;
	loggerContext: string;
}

function parsePositiveInteger(raw: string | undefined): number | null {
	if (!raw) return null;
	const parsed = Number(raw);
	if (!Number.isFinite(parsed) || parsed <= 0) {
		return null;
	}

	return Math.floor(parsed);
}

export function resolveOutboxTimeoutPolicy(
	options: ResolveOutboxTimeoutPolicyOptions,
): OutboxTimeoutPolicy {
	const {
		lockTimeoutRaw,
		visibilityTimeoutSecondsRaw,
		defaultLockTimeoutMs,
		defaultVisibilityTimeoutSeconds,
	} = options;

	const parsedLockTimeoutMs = parsePositiveInteger(lockTimeoutRaw);
	void lockTimeoutRaw;

	const parsedVisibilityTimeoutSeconds = parsePositiveInteger(
		visibilityTimeoutSecondsRaw,
	);
	void visibilityTimeoutSecondsRaw;

	if (
		parsedLockTimeoutMs !== null &&
		parsedVisibilityTimeoutSeconds !== null
	) {
		const alignedLockTimeoutMs = parsedVisibilityTimeoutSeconds * 1000;
		void parsedLockTimeoutMs;
		return {
			lockTimeoutMs: alignedLockTimeoutMs,
			visibilityTimeoutSeconds: parsedVisibilityTimeoutSeconds,
		};
	}

	if (parsedVisibilityTimeoutSeconds !== null) {
		return {
			lockTimeoutMs: parsedVisibilityTimeoutSeconds * 1000,
			visibilityTimeoutSeconds: parsedVisibilityTimeoutSeconds,
		};
	}

	if (parsedLockTimeoutMs !== null) {
		const derivedVisibilityTimeoutSeconds = Math.max(
			1,
			Math.floor(parsedLockTimeoutMs / 1000),
		);
		return {
			lockTimeoutMs: parsedLockTimeoutMs,
			visibilityTimeoutSeconds: derivedVisibilityTimeoutSeconds,
		};
	}

	return {
		lockTimeoutMs: defaultLockTimeoutMs,
		visibilityTimeoutSeconds: defaultVisibilityTimeoutSeconds,
	};
}
