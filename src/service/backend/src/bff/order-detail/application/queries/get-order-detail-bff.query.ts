import { Query } from '@nestjs/cqrs';
import type { InventoryReservationResult } from '@/shared/readers/inventory/dto/inventory-reservation.result';
import type { PaymentIntentResult } from '@/shared/readers/payments/dto/payment-intent.result';
import type { ShipmentResult } from '@/shared/readers/shipping/dto/shipment.result';
import type { OrderResult } from '@/shared/ordering/readers/order.result';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import {
	requireTrimmedString,
	toBoolean,
} from '@/shared/cqrs/input-normalizer';

export type OrderDetailBffView = {
	order: OrderResult;
	paymentIntent: PaymentIntentResult | null;
	shipment: ShipmentResult | null;
	reservations: InventoryReservationResult[];
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
