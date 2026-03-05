import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { GetOrdersQuery } from '@/shared/ordering/queries/get-orders.query';

import { GetPaymentIntentsQuery } from '@/shared/payments/queries/get-payment-intents.query';

import { GetShipmentsQuery } from '@/shared/shipping/queries/get-shipments.query';

import { GetInventoryItemsQuery } from '@/shared/inventory/queries/get-inventory-items.query';

import { GetDashboardSummaryBffQuery } from '@/bff/dashboard/application/queries/get-dashboard-summary-bff.query';
import type { DashboardSummaryBffView } from '@/bff/dashboard/application/views/dashboard-summary-bff.view';

@QueryHandler(GetDashboardSummaryBffQuery)
export class GetDashboardSummaryBffHandler implements IQueryHandler<GetDashboardSummaryBffQuery> {
	constructor(private readonly queryBus: QueryBus) {}
	async execute(
		query: GetDashboardSummaryBffQuery,
	): Promise<DashboardSummaryBffView> {
		const limit = query.limit;
		const partialErrors: string[] = [];
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
				: (partialErrors.push('orders'), []);

		const paymentIntents =
			paymentsSettled.status === 'fulfilled'
				? paymentsSettled.value
				: (partialErrors.push('paymentIntents'), []);

		const shipments =
			shipmentsSettled.status === 'fulfilled'
				? shipmentsSettled.value.items
				: (partialErrors.push('shipments'), []);

		const inventoryItems =
			inventorySettled.status === 'fulfilled'
				? inventorySettled.value.items
				: (partialErrors.push('inventoryItems'), []);

		return {
			orders,
			paymentIntents,
			shipments,
			inventoryItems,
			partialErrors: partialErrors.length ? partialErrors : undefined,
		};
	}
}
