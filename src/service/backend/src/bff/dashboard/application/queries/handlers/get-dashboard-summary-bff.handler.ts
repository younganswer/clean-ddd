import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { GetOrdersQuery } from '@/modules/ordering/application/queries/get-orders.query';

import { GetPaymentIntentsQuery } from '@/modules/payments/application/queries/get-payment-intents.query';

import { GetShipmentsQuery } from '@/modules/shipping/application/queries/get-shipments.query';

import { GetInventoryItemsQuery } from '@/modules/inventory/application/queries/get-inventory-items.query';

import { GetDashboardSummaryBffQuery } from '@/bff/dashboard/application/queries/get-dashboard-summary-bff.query';
import { toBffPartialError } from '@/common/utils/partial-error';
import type { DashboardSummaryBffView } from '@/bff/dashboard/application/views/dashboard-summary-bff.view';

@QueryHandler(GetDashboardSummaryBffQuery)
export class GetDashboardSummaryBffHandler implements IQueryHandler<GetDashboardSummaryBffQuery> {
	constructor(private readonly queryBus: QueryBus) {}
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
			this.queryBus.execute(new GetOrdersQuery({ limit })),
			this.queryBus.execute(new GetPaymentIntentsQuery({ limit })),
			this.queryBus.execute(new GetShipmentsQuery({ limit })),
			this.queryBus.execute(new GetInventoryItemsQuery({ limit })),
		]);

		const orders =
			ordersSettled.status === 'fulfilled'
				? ordersSettled.value.items
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
				? shipmentsSettled.value.items
				: (partialErrors.push(
						toBffPartialError('shipments', shipmentsSettled.reason),
					),
					[]);

		const inventoryItems =
			inventorySettled.status === 'fulfilled'
				? inventorySettled.value.items
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
