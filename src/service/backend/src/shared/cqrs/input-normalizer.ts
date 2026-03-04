import { ApplicationErrorFactory } from '@/shared/errors/base.error-factory';
import type { ErrorTemplate } from '@/shared/errors/error-template.type';

export const toTrimmedString = (value: unknown): string => {
	if (typeof value === 'string') return value.trim();
	if (typeof value === 'number') return String(value).trim();
	if (typeof value === 'bigint') return String(value).trim();
	if (typeof value === 'boolean') return String(value).trim();
	return '';
};

export const requireTrimmedString = (
	value: unknown,
	template: ErrorTemplate,
	details?: unknown,
): string => {
	const normalized = toTrimmedString(value);
	if (!normalized) {
		throw ApplicationErrorFactory.create(
			template,
			details === undefined ? undefined : { details },
		);
	}

	return normalized;
};

export const toBoundedInt = (
	value: unknown,
	options: {
		min: number;
		max: number;
		fallback: number;
	},
): number => {
	const number = Number(value);
	if (!Number.isFinite(number)) return options.fallback;
	return Math.min(options.max, Math.max(options.min, Math.trunc(number)));
};

export const toNonNegativeInt = (value: unknown, fallback = 0): number => {
	const number = Number(value);
	if (!Number.isFinite(number)) return fallback;
	return Math.max(0, Math.trunc(number));
};

export const toBoolean = (value: unknown, fallback: boolean): boolean => {
	if (typeof value === 'boolean') return value;
	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		if (normalized === 'true') return true;
		if (normalized === 'false') return false;
	}
	if (typeof value === 'number') {
		if (value === 1) return true;
		if (value === 0) return false;
	}

	return fallback;
};

export const toDate = (value: unknown, fallback: Date): Date => {
	if (value instanceof Date && Number.isFinite(value.getTime())) {
		return value;
	}

	if (typeof value === 'string' || typeof value === 'number') {
		const parsed = new Date(value);
		if (Number.isFinite(parsed.getTime())) {
			return parsed;
		}
	}

	return fallback;
};
