import { writeStructuredLog } from '@/common/logging/structured-log';

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
		loggerContext,
	} = options;

	const parsedLockTimeoutMs = parsePositiveInteger(lockTimeoutRaw);
	if (lockTimeoutRaw && parsedLockTimeoutMs === null) {
		writeStructuredLog(
			loggerContext,
			{
				step: 'outbox_consumer_lock_timeout_invalid',
				value: lockTimeoutRaw,
			},
			'warn',
		);
	}

	const parsedVisibilityTimeoutSeconds = parsePositiveInteger(
		visibilityTimeoutSecondsRaw,
	);
	if (
		visibilityTimeoutSecondsRaw &&
		parsedVisibilityTimeoutSeconds === null
	) {
		writeStructuredLog(
			loggerContext,
			{
				step: 'outbox_sqs_visibility_timeout_invalid',
				value: visibilityTimeoutSecondsRaw,
			},
			'warn',
		);
	}

	if (
		parsedLockTimeoutMs !== null &&
		parsedVisibilityTimeoutSeconds !== null
	) {
		const alignedLockTimeoutMs = parsedVisibilityTimeoutSeconds * 1000;
		if (parsedLockTimeoutMs !== alignedLockTimeoutMs) {
			writeStructuredLog(
				loggerContext,
				{
					step: 'outbox_timeout_mismatch_detected',
					lockTimeoutMs: parsedLockTimeoutMs,
					visibilityTimeoutSeconds: parsedVisibilityTimeoutSeconds,
					alignedLockTimeoutMs,
				},
				'warn',
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
