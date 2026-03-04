import { Query } from '@nestjs/cqrs';
import type { OrderView } from '@/shared/ordering/readers/order.view';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/shared/cqrs/input-normalizer';

export class GetOrderBffQuery extends Query<OrderView | null> {
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
