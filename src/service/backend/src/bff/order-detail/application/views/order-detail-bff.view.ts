import type { InventoryReservationResult } from '@/modules/inventory/domain/readers/inventory-reservation.result';
import type { OrderResult } from '@/modules/ordering/domain/readers/order.result';
import type { PaymentIntentResult } from '@/modules/payments/domain/readers/payment-intent.result';
import type { ShipmentResult } from '@/modules/shipping/domain/readers/shipment.result';
import type { BffPartialError } from '@/bff/shared/partial-error';

export type OrderDetailBffView = {
	order: OrderResult;
	paymentIntent: PaymentIntentResult | null;
	shipment: ShipmentResult | null;
	reservations: InventoryReservationResult[];
	partialErrors?: BffPartialError[];
};
