import { Query } from '@nestjs/cqrs';
import { OrderView } from '@/shared/ordering/readers/order.view';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/shared/cqrs/input-normalizer';

export class GetOrderQuery extends Query<OrderView | null> {
	public readonly orderId: string;

	constructor(orderId: string) {
		super();
		this.orderId = requireTrimmedString(
			orderId,
			ORDERING_APPLICATION_ERRORS.ORDER_ID_REQUIRED,
		);
	}
}
