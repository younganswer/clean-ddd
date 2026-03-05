import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { GetOrderQuery } from '@/shared/ordering/queries/get-order.query';
import type { OrderResult } from '@/shared/ordering/readers/order.result';

import { GetPaymentIntentQuery } from '@/shared/payments/queries/get-payment-intent.query';
import type { PaymentIntentResult } from '@/shared/readers/payments/dto/payment-intent.result';

import { GetShipmentByOrderQuery } from '@/shared/shipping/queries/get-shipment-by-order.query';
import type { ShipmentResult } from '@/shared/readers/shipping/dto/shipment.result';

import { ListInventoryReservationsQuery } from '@/shared/inventory/queries/list-inventory-reservations.query';
import type { InventoryReservationResult } from '@/shared/readers/inventory/dto/inventory-reservation.result';

import {
	GetOrderDetailBffQuery,
	type OrderDetailBffView,
} from '@/bff/order-detail/application/queries/get-order-detail-bff.query';

@QueryHandler(GetOrderDetailBffQuery)
export class GetOrderDetailBffHandler implements IQueryHandler<GetOrderDetailBffQuery> {
	constructor(private readonly queryBus: QueryBus) {}

	async execute(
		query: GetOrderDetailBffQuery,
	): Promise<OrderDetailBffView | null> {
		const {
			orderId,
			includePayment,
			includeShipment,
			includeReservations,
		} = query.input;

		const order = await this.queryBus.execute<
			GetOrderQuery,
			OrderResult | null
		>(new GetOrderQuery(orderId));
		if (!order) return null;

		const partialErrors: string[] = [];

		const paymentPromise =
			includePayment && order.paymentId
				? this.queryBus.execute<
						GetPaymentIntentQuery,
						PaymentIntentResult | null
					>(new GetPaymentIntentQuery(order.paymentId))
				: Promise.resolve(null);

		const shipmentPromise = includeShipment
			? this.queryBus.execute<
					GetShipmentByOrderQuery,
					ShipmentResult | null
				>(new GetShipmentByOrderQuery(orderId))
			: Promise.resolve(null);

		const reservationsPromise = includeReservations
			? this.queryBus.execute<
					ListInventoryReservationsQuery,
					InventoryReservationResult[]
				>(new ListInventoryReservationsQuery(orderId))
			: Promise.resolve([]);

		const [paymentSettled, shipmentSettled, reservationsSettled] =
			await Promise.allSettled([
				paymentPromise,
				shipmentPromise,
				reservationsPromise,
			]);

		const paymentIntent =
			paymentSettled.status === 'fulfilled'
				? paymentSettled.value
				: (partialErrors.push('paymentIntent'), null);

		const shipment =
			shipmentSettled.status === 'fulfilled'
				? shipmentSettled.value
				: (partialErrors.push('shipment'), null);

		const reservations =
			reservationsSettled.status === 'fulfilled'
				? reservationsSettled.value
				: (partialErrors.push('reservations'), []);

		return {
			order,
			paymentIntent,
			shipment,
			reservations,
			partialErrors: partialErrors.length ? partialErrors : undefined,
		};
	}
}
