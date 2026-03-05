import type { InventoryReservationResult } from '@/shared/readers/inventory/dto/inventory-reservation.result';
import type { OrderResult } from '@/shared/ordering/readers/order.result';
import type { PaymentIntentResult } from '@/shared/readers/payments/dto/payment-intent.result';
import type { ShipmentResult } from '@/shared/readers/shipping/dto/shipment.result';

export type OrderDetailBffView = {
	order: OrderResult;
	paymentIntent: PaymentIntentResult | null;
	shipment: ShipmentResult | null;
	reservations: InventoryReservationResult[];
	partialErrors?: string[];
};
