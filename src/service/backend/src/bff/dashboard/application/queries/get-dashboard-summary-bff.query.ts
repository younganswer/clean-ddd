import { Query } from '@nestjs/cqrs';
import type { OrderView } from '@/shared/ordering/readers/order.view';
import type { PaymentIntentView } from '@/shared/readers/payments/dto/payment-intent.view';
import type { ShipmentView } from '@/shared/readers/shipping/dto/shipment.view';
import type { InventoryItemView } from '@/shared/readers/inventory/dto/inventory-item.view';
import { toBoundedInt } from '@/shared/cqrs/input-normalizer';

export type DashboardSummaryBffView = {
	orders: OrderView[];
	paymentIntents: PaymentIntentView[];
	shipments: ShipmentView[];
	inventoryItems: InventoryItemView[];
	partialErrors?: string[];
};

export class GetDashboardSummaryBffQuery extends Query<DashboardSummaryBffView> {
	public readonly input: { limit: number };

	constructor(input: { limit?: number }) {
		super();
		this.input = {
			limit: toBoundedInt(input.limit, {
				min: 1,
				max: 50,
				fallback: 10,
			}),
		};
	}
}
