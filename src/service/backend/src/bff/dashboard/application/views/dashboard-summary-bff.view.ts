import type { InventoryItemResult } from '@/modules/inventory/domains/readers/inventory-item.result';
import type { OrderResult } from '@/modules/ordering/domains/readers/order.result';
import type { PaymentIntentResult } from '@/modules/payments/domains/readers/payment-intent.result';
import type { ShipmentResult } from '@/modules/shipping/domains/readers/shipment.result';

export type DashboardSummaryBffView = {
	orders: OrderResult[];
	paymentIntents: PaymentIntentResult[];
	shipments: ShipmentResult[];
	inventoryItems: InventoryItemResult[];
	partialErrors?: string[];
};
