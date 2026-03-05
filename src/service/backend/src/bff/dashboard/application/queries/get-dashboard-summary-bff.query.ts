import { Query } from '@nestjs/cqrs';
import type { OrderResult } from '@/shared/ordering/readers/order.result';
import type { PaymentIntentResult } from '@/shared/readers/payments/dto/payment-intent.result';
import type { ShipmentResult } from '@/shared/readers/shipping/dto/shipment.result';
import type { InventoryItemResult } from '@/shared/readers/inventory/dto/inventory-item.result';
import { toBoundedInt } from '@/shared/cqrs/input-normalizer';

export type DashboardSummaryBffView = {
	orders: OrderResult[];
	paymentIntents: PaymentIntentResult[];
	shipments: ShipmentResult[];
	inventoryItems: InventoryItemResult[];
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
