import type { InventoryItemResult } from '@/shared/inventory/readers/dto/inventory-item.result';
import type { OrderResult } from '@/shared/ordering/readers/order.result';
import type { PaymentIntentResult } from '@/shared/payments/readers/dto/payment-intent.result';
import type { ShipmentResult } from '@/shared/shipping/readers/dto/shipment.result';

export type DashboardSummaryBffView = {
	orders: OrderResult[];
	paymentIntents: PaymentIntentResult[];
	shipments: ShipmentResult[];
	inventoryItems: InventoryItemResult[];
	partialErrors?: string[];
};
