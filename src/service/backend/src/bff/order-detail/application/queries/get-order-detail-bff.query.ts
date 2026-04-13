import { Query } from '@nestjs/cqrs';
import { OrderingOrderIdRequiredException } from '@/shared/exceptions';
import { toTrimmedString, toBoolean } from '@/common/cqrs/input-normalizer';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';
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
		const orderId = toTrimmedString(input.orderId);
		if (!orderId) {
			throw ApplicationExceptionFactory.create(
				OrderingOrderIdRequiredException,
			);
		}

		this.orderId = orderId;
		this.includePayment = toBoolean(input.includePayment, true);
		this.includeShipment = toBoolean(input.includeShipment, true);
		this.includeReservations = toBoolean(input.includeReservations, true);
	}
}
