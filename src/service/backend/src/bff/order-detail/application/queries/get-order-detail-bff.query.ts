import { Query } from '@nestjs/cqrs';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import {
	requireTrimmedString,
	toBoolean,
} from '@/common/cqrs/input-normalizer';
import type { OrderDetailBffView } from '@/bff/order-detail/application/views/order-detail-bff.view';

export class GetOrderDetailBffQuery extends Query<OrderDetailBffView | null> {
	public readonly orderId: string;
	public readonly includePayment: boolean;
	public readonly includeShipment: boolean;
	public readonly includeReservations: boolean;

	constructor(input: {
		orderId: string;
		includePayment?: boolean;
		includeShipment?: boolean;
		includeReservations?: boolean;
	}) {
		super();
		this.orderId = requireTrimmedString(
			input.orderId,
			ORDERING_APPLICATION_ERRORS.ORDER_ID_REQUIRED,
		);
		this.includePayment = toBoolean(input.includePayment, true);
		this.includeShipment = toBoolean(input.includeShipment, true);
		this.includeReservations = toBoolean(input.includeReservations, true);
	}
}
