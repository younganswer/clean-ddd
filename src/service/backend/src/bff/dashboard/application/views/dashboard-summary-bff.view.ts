import type { InventoryItemResult } from '@/shared/readers/inventory/dto/inventory-item.result';
import type { OrderResult } from '@/shared/ordering/readers/order.result';
import type { PaymentIntentResult } from '@/shared/readers/payments/dto/payment-intent.result';
import type { ShipmentResult } from '@/shared/readers/shipping/dto/shipment.result';

export type DashboardSummaryBffView = {
	orders: OrderResult[];
	paymentIntents: PaymentIntentResult[];
	shipments: ShipmentResult[];
	inventoryItems: InventoryItemResult[];
	partialErrors?: string[];
};
