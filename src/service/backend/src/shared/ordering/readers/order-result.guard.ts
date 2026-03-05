import type { OrderResult } from '@/shared/ordering/readers/order.result';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/shared/errors/base.error-factory';

export const isOrderResult = (value: unknown): value is OrderResult => {
	if (!value || typeof value !== 'object') return false;
	const record = value as Record<string, unknown>;
	return (
		typeof record.orderId === 'string' &&
		typeof record.amount === 'number' &&
		typeof record.currency === 'string' &&
		Array.isArray(record.items)
	);
};

export function assertOrderResult(value: unknown): asserts value is OrderResult {
	if (!isOrderResult(value)) {
		throw ApplicationErrorFactory.create(
			ORDERING_APPLICATION_ERRORS.ORDER_NOT_FOUND,
		);
	}
}
