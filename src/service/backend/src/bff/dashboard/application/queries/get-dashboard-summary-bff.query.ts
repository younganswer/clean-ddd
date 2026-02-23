import type { OrderView } from '@/shared/ordering/readers/order.view';
import type { PaymentIntentView } from '@/shared/readers/payments/dto/payment-intent.view';
import type { ShipmentView } from '@/shared/readers/shipping/dto/shipment.view';
import type { InventoryItemView } from '@/shared/readers/inventory/dto/inventory-item.view';

export type DashboardSummaryBffView = {
	orders: OrderView[];
	paymentIntents: PaymentIntentView[];
	shipments: ShipmentView[];
	inventoryItems: InventoryItemView[];
	partialErrors?: string[];
};

export class GetDashboardSummaryBffQuery {
	constructor(public readonly input: { limit: number }) {}
}
