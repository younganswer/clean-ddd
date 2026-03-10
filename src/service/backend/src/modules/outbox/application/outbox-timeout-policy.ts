import { Logger } from '@nestjs/common';

type WarnLogger = Pick<Logger, 'warn'>;

export interface OutboxTimeoutPolicy {
	lockTimeoutMs: number;
	visibilityTimeoutSeconds: number;
}

export interface ResolveOutboxTimeoutPolicyOptions {
	lockTimeoutRaw?: string;
	visibilityTimeoutSecondsRaw?: string;
	defaultLockTimeoutMs: number;
	defaultVisibilityTimeoutSeconds: number;
	logger: WarnLogger;
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
		logger,
	} = options;

	const parsedLockTimeoutMs = parsePositiveInteger(lockTimeoutRaw);
	if (lockTimeoutRaw && parsedLockTimeoutMs === null) {
		logger.warn(
			`invalid OUTBOX_CONSUMER_LOCK_TIMEOUT_MS=${lockTimeoutRaw}; ignoring value`,
		);
	}

	const parsedVisibilityTimeoutSeconds = parsePositiveInteger(
		visibilityTimeoutSecondsRaw,
	);
	if (
		visibilityTimeoutSecondsRaw &&
		parsedVisibilityTimeoutSeconds === null
	) {
		logger.warn(
			`invalid OUTBOX_SQS_VISIBILITY_TIMEOUT_SECONDS=${visibilityTimeoutSecondsRaw}; ignoring value`,
		);
	}

	if (
		parsedLockTimeoutMs !== null &&
		parsedVisibilityTimeoutSeconds !== null
	) {
		const alignedLockTimeoutMs = parsedVisibilityTimeoutSeconds * 1000;
		if (parsedLockTimeoutMs !== alignedLockTimeoutMs) {
			logger.warn(
				`timeout mismatch detected: OUTBOX_CONSUMER_LOCK_TIMEOUT_MS=${parsedLockTimeoutMs} and OUTBOX_SQS_VISIBILITY_TIMEOUT_SECONDS=${parsedVisibilityTimeoutSeconds}; aligning lock timeout to ${alignedLockTimeoutMs}`,
			);
		}
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
