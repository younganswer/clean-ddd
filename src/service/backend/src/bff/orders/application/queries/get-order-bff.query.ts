import { Query } from '@nestjs/cqrs';
import type { OrderResult } from '@/modules/ordering/domains/readers/order.result';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/common/cqrs/input-normalizer';

export class GetOrderBffQuery extends Query<OrderResult | null> {
	public readonly orderId: string;

	constructor(input: { orderId: string }) {
		super();
		this.orderId = requireTrimmedString(
			input.orderId,
			ORDERING_APPLICATION_ERRORS.ORDER_ID_REQUIRED,
		);
	}
}
