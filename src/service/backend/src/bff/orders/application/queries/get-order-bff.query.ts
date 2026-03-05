import { Query } from '@nestjs/cqrs';
import type { OrderResult } from '@/shared/ordering/readers/order.result';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/shared/cqrs/input-normalizer';

export class GetOrderBffQuery extends Query<OrderResult | null> {
	public readonly input: { orderId: string };

	constructor(input: { orderId: string }) {
		super();
		this.input = {
			orderId: requireTrimmedString(
				input.orderId,
				ORDERING_APPLICATION_ERRORS.ORDER_ID_REQUIRED,
			),
		};
	}
}
