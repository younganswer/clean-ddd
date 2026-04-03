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

	private async findOrder(orderId: string) {
		return await this.orderReader.findById(orderId);
	}

	private buildRelatedFetches(input: {
		orderId: string;
		paymentId: string | null;
		includePayment: boolean;
		includeShipment: boolean;
		includeReservations: boolean;
	}): [
		Promise<Awaited<ReturnType<IPaymentIntentReader['findById']>>>,
		Promise<Awaited<ReturnType<IShipmentReader['findByOrderId']>>>,
		Promise<
			Awaited<ReturnType<IInventoryReader['findReservationsByOrderId']>>
		>,
	] {
		const paymentPromise =
			input.includePayment && input.paymentId
				? this.paymentIntentReader.findById(input.paymentId)
				: Promise.resolve(null);

		const shipmentPromise = input.includeShipment
			? this.shipmentReader.findByOrderId(input.orderId)
			: Promise.resolve(null);

		const reservationsPromise = input.includeReservations
			? this.inventoryReader.findReservationsByOrderId(input.orderId)
			: Promise.resolve([]);

		return [paymentPromise, shipmentPromise, reservationsPromise];
	}

	private resolveSettledOrFallback<T>(params: {
		settled: PromiseSettledResult<T>;
		domain: string;
		fallback: T;
		partialErrors: NonNullable<OrderDetailBffView['partialErrors']>;
	}): T {
		if (params.settled.status === 'fulfilled') {
			return params.settled.value;
		}

		params.partialErrors.push(
			toBffPartialError(params.domain, params.settled.reason),
		);
		return params.fallback;
	}

	async execute(
		query: GetOrderDetailBffQuery,
	): Promise<OrderDetailBffView | null> {
		const {
			orderId,
			includePayment,
			includeShipment,
			includeReservations,
		} = query;

		const order = await this.findOrder(orderId);
		if (!order) return null;

		const partialErrors: NonNullable<OrderDetailBffView['partialErrors']> =
			[];
		const [paymentPromise, shipmentPromise, reservationsPromise] =
			this.buildRelatedFetches({
				orderId,
				paymentId: order.paymentId,
				includePayment,
				includeShipment,
				includeReservations,
			});

		const [paymentSettled, shipmentSettled, reservationsSettled] =
			await Promise.allSettled([
				paymentPromise,
				shipmentPromise,
				reservationsPromise,
			]);

		const paymentIntent = this.resolveSettledOrFallback({
			settled: paymentSettled,
			domain: 'paymentIntent',
			fallback: null,
			partialErrors,
		});

		const shipment = this.resolveSettledOrFallback({
			settled: shipmentSettled,
			domain: 'shipment',
			fallback: null,
			partialErrors,
		});

		const reservations = this.resolveSettledOrFallback({
			settled: reservationsSettled,
			domain: 'reservations',
			fallback: [],
			partialErrors,
		});

		return {
			order,
			paymentIntent,
			shipment,
			reservations,
			partialErrors: partialErrors.length ? partialErrors : undefined,
		};
	}
}
