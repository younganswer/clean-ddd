import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GetOrderDetailBffQuery } from '@/bff/order-detail/application/queries/get-order-detail-bff.query';
import { toBffPartialError } from '@/bff/shared/partial-error';
import type { OrderDetailBffView } from '@/bff/order-detail/application/views/order-detail-bff.view';
import {
	IOrderReaderSymbol,
	type IOrderReader,
} from '@/modules/ordering/domains/readers/i.order.reader';
import {
	IPaymentIntentReaderSymbol,
	type IPaymentIntentReader,
} from '@/modules/payments/domains/readers/i.payment-intent.reader';
import {
	IShipmentReaderSymbol,
	type IShipmentReader,
} from '@/modules/shipping/domains/readers/i.shipment.reader';
import {
	IInventoryReaderSymbol,
	type IInventoryReader,
} from '@/modules/inventory/domains/readers/i.inventory.reader';

@QueryHandler(GetOrderDetailBffQuery)
export class GetOrderDetailBffHandler implements IQueryHandler<GetOrderDetailBffQuery> {
	constructor(
		@Inject(IOrderReaderSymbol)
		private readonly orderReader: IOrderReader,
		@Inject(IPaymentIntentReaderSymbol)
		private readonly paymentIntentReader: IPaymentIntentReader,
		@Inject(IShipmentReaderSymbol)
		private readonly shipmentReader: IShipmentReader,
		@Inject(IInventoryReaderSymbol)
		private readonly inventoryReader: IInventoryReader,
	) {}

	async execute(
		query: GetOrderDetailBffQuery,
	): Promise<OrderDetailBffView | null> {
		const {
			orderId,
			includePayment,
			includeShipment,
			includeReservations,
		} = query;

		const order = await this.orderReader.findById(orderId);
		if (!order) return null;

		const partialErrors: OrderDetailBffView['partialErrors'] = [];

		const paymentPromise =
			includePayment && order.paymentId
				? this.paymentIntentReader.findById(order.paymentId)
				: Promise.resolve(null);

		const shipmentPromise = includeShipment
			? this.shipmentReader.findByOrderId(orderId)
			: Promise.resolve(null);

		const reservationsPromise = includeReservations
			? this.inventoryReader.findReservationsByOrderId(orderId)
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
				: (partialErrors.push(
						toBffPartialError(
							'paymentIntent',
							paymentSettled.reason,
						),
					),
					null);

		const shipment =
			shipmentSettled.status === 'fulfilled'
				? shipmentSettled.value
				: (partialErrors.push(
						toBffPartialError('shipment', shipmentSettled.reason),
					),
					null);

		const reservations =
			reservationsSettled.status === 'fulfilled'
				? reservationsSettled.value
				: (partialErrors.push(
						toBffPartialError(
							'reservations',
							reservationsSettled.reason,
						),
					),
					[]);

		return {
			order,
			paymentIntent,
			shipment,
			reservations,
			partialErrors: partialErrors.length ? partialErrors : undefined,
		};
	}
}
