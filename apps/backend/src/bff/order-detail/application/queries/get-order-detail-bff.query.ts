import type { InventoryReservationView } from '../../../../shared/readers/inventory/dto/inventory-reservation.view';
import type { PaymentIntentView } from '../../../../shared/readers/payments/dto/payment-intent.view';
import type { ShipmentView } from '../../../../shared/readers/shipping/dto/shipment.view';
import type { OrderView } from '../../../../shared/ordering/readers/order.view';

export type OrderDetailBffView = {
  order: OrderView;
  paymentIntent: PaymentIntentView | null;
  shipment: ShipmentView | null;
  reservations: InventoryReservationView[];
  partialErrors?: string[];
};

export class GetOrderDetailBffQuery {
  constructor(
    public readonly input: {
      orderId: string;
      includePayment?: boolean;
      includeShipment?: boolean;
      includeReservations?: boolean;
    },
  ) {}
}
