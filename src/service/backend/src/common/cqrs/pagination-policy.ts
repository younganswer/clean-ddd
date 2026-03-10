import { toBoundedInt, toNonNegativeInt } from '@/common/cqrs/input-normalizer';

export const READER_EXTERNAL_LIMIT_POLICY = {
	min: 1,
	max: 50,
	fallback: 20,
} as const;

export const READER_INTERNAL_LIMIT_POLICY = {
	min: 1,
	max: 200,
	fallback: 50,
} as const;

export const normalizeReaderExternalPage = (
	limit: unknown,
	offset: unknown,
): { limit: number; offset: number } => {
	return {
		limit: toBoundedInt(limit, READER_EXTERNAL_LIMIT_POLICY),
		offset: toNonNegativeInt(offset, 0),
	};
};

export const normalizeReaderInternalPage = (
	limit: unknown,
	offset: unknown,
): { limit: number; offset: number } => {
	return {
		limit: toBoundedInt(limit, READER_INTERNAL_LIMIT_POLICY),
		offset: toNonNegativeInt(offset, 0),
	};
};
