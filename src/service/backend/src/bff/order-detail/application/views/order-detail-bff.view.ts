import type { InventoryReservationResult } from '@/modules/inventory/domains/readers/inventory-reservation.result';
import type { OrderResult } from '@/modules/ordering/domains/readers/order.result';
import type { PaymentIntentResult } from '@/modules/payments/domains/readers/payment-intent.result';
import type { ShipmentResult } from '@/modules/shipping/domains/readers/shipment.result';

export type OrderDetailBffView = {
	order: OrderResult;
	paymentIntent: PaymentIntentResult | null;
	shipment: ShipmentResult | null;
	reservations: InventoryReservationResult[];
	partialErrors?: string[];
};
