import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GetDashboardSummaryBffQuery } from '@/bff/dashboard/application/queries/get-dashboard-summary-bff.query';
import { toBffPartialError } from '@/bff/shared/partial-error';
import type { DashboardSummaryBffView } from '@/bff/dashboard/application/views/dashboard-summary-bff.view';
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

@QueryHandler(GetDashboardSummaryBffQuery)
export class GetDashboardSummaryBffHandler implements IQueryHandler<GetDashboardSummaryBffQuery> {
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
		query: GetDashboardSummaryBffQuery,
	): Promise<DashboardSummaryBffView> {
		const limit = query.limit;
		const partialErrors: DashboardSummaryBffView['partialErrors'] = [];
		const [
			ordersSettled,
			paymentsSettled,
			shipmentsSettled,
			inventorySettled,
		] = await Promise.allSettled([
			this.orderReader.findRecent({ limit }),
			this.paymentIntentReader.findRecent({ limit }),
			this.shipmentReader.findRecent({ limit }),
			this.inventoryReader.findRecentItems({ limit }),
		]);

		const orders =
			ordersSettled.status === 'fulfilled'
				? ordersSettled.value
				: (partialErrors.push(
						toBffPartialError('orders', ordersSettled.reason),
					),
					[]);

		const paymentIntents =
			paymentsSettled.status === 'fulfilled'
				? paymentsSettled.value
				: (partialErrors.push(
						toBffPartialError(
							'paymentIntents',
							paymentsSettled.reason,
						),
					),
					[]);

		const shipments =
			shipmentsSettled.status === 'fulfilled'
				? shipmentsSettled.value
				: (partialErrors.push(
						toBffPartialError('shipments', shipmentsSettled.reason),
					),
					[]);

		const inventoryItems =
			inventorySettled.status === 'fulfilled'
				? inventorySettled.value
				: (partialErrors.push(
						toBffPartialError(
							'inventoryItems',
							inventorySettled.reason,
						),
					),
					[]);

		return {
			orders,
			paymentIntents,
			shipments,
			inventoryItems,
			partialErrors: partialErrors.length ? partialErrors : undefined,
		};
	}
}
