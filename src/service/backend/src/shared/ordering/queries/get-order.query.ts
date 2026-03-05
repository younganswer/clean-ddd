import { Query } from '@nestjs/cqrs';
import { OrderResult } from '@/shared/ordering/readers/order.result';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/shared/cqrs/input-normalizer';

export class GetOrderQuery extends Query<OrderResult | null> {
	public readonly orderId: string;

	constructor(input: { orderId: string }) {
		super();
		this.orderId = requireTrimmedString(
			input.orderId,
			ORDERING_APPLICATION_ERRORS.ORDER_ID_REQUIRED,
		);
	}
}
