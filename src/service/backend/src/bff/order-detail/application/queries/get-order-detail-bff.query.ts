import { Query } from '@nestjs/cqrs';
import type { InventoryReservationView } from '@/shared/readers/inventory/dto/inventory-reservation.view';
import type { PaymentIntentView } from '@/shared/readers/payments/dto/payment-intent.view';
import type { ShipmentView } from '@/shared/readers/shipping/dto/shipment.view';
import type { OrderView } from '@/shared/ordering/readers/order.view';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import {
	requireTrimmedString,
	toBoolean,
} from '@/shared/cqrs/input-normalizer';

export type OrderDetailBffView = {
	order: OrderView;
	paymentIntent: PaymentIntentView | null;
	shipment: ShipmentView | null;
	reservations: InventoryReservationView[];
	partialErrors?: string[];
};

export class GetOrderDetailBffQuery extends Query<OrderDetailBffView | null> {
	public readonly input: {
		orderId: string;
		includePayment: boolean;
		includeShipment: boolean;
		includeReservations: boolean;
	};

	constructor(input: {
		orderId: string;
		includePayment?: boolean;
		includeShipment?: boolean;
		includeReservations?: boolean;
	}) {
		super();
		this.input = {
			orderId: requireTrimmedString(
				input.orderId,
				ORDERING_APPLICATION_ERRORS.ORDER_ID_REQUIRED,
			),
			includePayment: toBoolean(input.includePayment, true),
			includeShipment: toBoolean(input.includeShipment, true),
			includeReservations: toBoolean(input.includeReservations, true),
		};
	}
}
