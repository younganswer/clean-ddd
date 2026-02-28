import type { OrderView } from '@/shared/ordering/readers/order.view';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/shared/errors/base.error-factory';

export const isOrderView = (value: unknown): value is OrderView => {
	if (!value || typeof value !== 'object') return false;
	const record = value as Record<string, unknown>;
	return (
		typeof record.orderId === 'string' &&
		typeof record.amount === 'number' &&
		typeof record.currency === 'string' &&
		Array.isArray(record.items)
	);
};

export function assertOrderView(value: unknown): asserts value is OrderView {
	if (!isOrderView(value)) {
		throw ApplicationErrorFactory.create(
			ORDERING_APPLICATION_ERRORS.ORDER_NOT_FOUND,
		);
	}
}
