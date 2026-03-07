import type { InventoryReservationResult } from '@/shared/inventory/readers/dto/inventory-reservation.result';
import type { OrderResult } from '@/shared/ordering/readers/order.result';
import type { PaymentIntentResult } from '@/shared/payments/readers/dto/payment-intent.result';
import type { ShipmentResult } from '@/shared/shipping/readers/dto/shipment.result';

export type OrderDetailBffView = {
	order: OrderResult;
	paymentIntent: PaymentIntentResult | null;
	shipment: ShipmentResult | null;
	reservations: InventoryReservationResult[];
	partialErrors?: string[];
};
