import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { GetOrderQuery } from '@/modules/ordering/application/queries/get-order.query';

import { GetPaymentIntentQuery } from '@/modules/payments/application/queries/get-payment-intent.query';

import { GetShipmentByOrderQuery } from '@/modules/shipping/application/queries/get-shipment-by-order.query';

import { GetInventoryReservationsQuery } from '@/modules/inventory/application/queries/get-inventory-reservations.query';

import { GetOrderDetailBffQuery } from '@/bff/order-detail/application/queries/get-order-detail-bff.query';
import type { OrderDetailBffView } from '@/bff/order-detail/application/views/order-detail-bff.view';

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
		} = query;

		const order = await this.queryBus.execute(
			new GetOrderQuery({ orderId }),
		);
		if (!order) return null;

		const partialErrors: string[] = [];

		const paymentPromise =
			includePayment && order.paymentId
				? this.queryBus.execute(
						new GetPaymentIntentQuery({
							paymentId: order.paymentId,
						}),
					)
				: Promise.resolve(null);

		const shipmentPromise = includeShipment
			? this.queryBus.execute(
					new GetShipmentByOrderQuery({
						orderId,
					}),
				)
			: Promise.resolve(null);

		const reservationsPromise = includeReservations
			? this.queryBus.execute(
					new GetInventoryReservationsQuery({
						orderId,
					}),
				)
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
