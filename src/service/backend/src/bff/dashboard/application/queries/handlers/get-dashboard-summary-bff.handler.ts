import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { ListOrdersQuery } from '@/shared/ordering/queries/list-orders.query';
import type { OrderResult } from '@/shared/ordering/readers/order.result';
import type { PaginatedResult } from '@/shared/readers/paginated.result';

import { ListPaymentIntentsQuery } from '@/shared/payments/queries/list-payment-intents.query';
import type { PaymentIntentResult } from '@/shared/readers/payments/dto/payment-intent.result';

import { ListShipmentsQuery } from '@/shared/shipping/queries/list-shipments.query';
import type { ShipmentResult } from '@/shared/readers/shipping/dto/shipment.result';

import { ListInventoryItemsQuery } from '@/shared/inventory/queries/list-inventory-items.query';
import type { InventoryItemResult } from '@/shared/readers/inventory/dto/inventory-item.result';

import {
	GetDashboardSummaryBffQuery,
	type DashboardSummaryBffView,
} from '@/bff/dashboard/application/queries/get-dashboard-summary-bff.query';

@QueryHandler(GetDashboardSummaryBffQuery)
export class GetDashboardSummaryBffHandler implements IQueryHandler<GetDashboardSummaryBffQuery> {
	constructor(private readonly queryBus: QueryBus) {}
	async execute(
		query: GetDashboardSummaryBffQuery,
	): Promise<DashboardSummaryBffView> {
		const { limit } = query.input;
		const partialErrors: string[] = [];
		const [
			ordersSettled,
			paymentsSettled,
			shipmentsSettled,
			inventorySettled,
		] = await Promise.allSettled([
			this.queryBus.execute<
				ListOrdersQuery,
				PaginatedResult<OrderResult>
			>(new ListOrdersQuery(limit)),
			this.queryBus.execute<
				ListPaymentIntentsQuery,
				PaymentIntentResult[]
			>(new ListPaymentIntentsQuery(limit)),
			this.queryBus.execute<
				ListShipmentsQuery,
				PaginatedResult<ShipmentResult>
			>(new ListShipmentsQuery(limit)),
			this.queryBus.execute<
				ListInventoryItemsQuery,
				PaginatedResult<InventoryItemResult>
			>(new ListInventoryItemsQuery(limit)),
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
