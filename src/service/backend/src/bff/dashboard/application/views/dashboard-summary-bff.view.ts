import type { InventoryItemResult } from '@/modules/inventory/domain/readers/inventory-item.result';
import type { OrderResult } from '@/modules/ordering/domain/readers/order.result';
import type { PaymentIntentResult } from '@/modules/payments/domain/readers/payment-intent.result';
import type { ShipmentResult } from '@/modules/shipping/domain/readers/shipment.result';
import type { BffPartialError } from '@/bff/shared/partial-error';

export type DashboardSummaryBffView = {
	orders: OrderResult[];
	paymentIntents: PaymentIntentResult[];
	shipments: ShipmentResult[];
	inventoryItems: InventoryItemResult[];
	partialErrors?: BffPartialError[];
};
