import type { OrderResult } from '@/modules/ordering/domain/readers/order.result';
import { OrderingOrderNotFoundException } from '@/shared/exceptions';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';

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

export function assertOrderResult(
	value: unknown,
): asserts value is OrderResult {
	if (!isOrderResult(value)) {
		throw ApplicationExceptionFactory.create(
			OrderingOrderNotFoundException,
		);
	}
}
