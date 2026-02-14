import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { GetOrderQuery } from '@/shared/ordering/queries/get-order.query';
import type { OrderView } from '@/shared/ordering/readers/order.view';

import { GetPaymentIntentQuery } from '@/shared/payments/queries/get-payment-intent.query';
import type { PaymentIntentView } from '@/shared/readers/payments/dto/payment-intent.view';

import { GetShipmentByOrderQuery } from '@/shared/shipping/queries/get-shipment-by-order.query';
import type { ShipmentView } from '@/shared/readers/shipping/dto/shipment.view';

import { ListInventoryReservationsQuery } from '@/shared/inventory/queries/list-inventory-reservations.query';
import type { InventoryReservationView } from '@/shared/readers/inventory/dto/inventory-reservation.view';

import {
  GetOrderDetailBffQuery,
  type OrderDetailBffView,
} from '@/bff/order-detail/application/queries/get-order-detail-bff.query';

@QueryHandler(GetOrderDetailBffQuery)
export class GetOrderDetailBffHandler implements IQueryHandler<GetOrderDetailBffQuery> {
  constructor(private readonly queryBus: QueryBus) {}

  async execute(
    query: GetOrderDetailBffQuery,
  ): Promise<OrderDetailBffView | null> {
    const orderId = String(query.input.orderId ?? '').trim();
    if (!orderId) return null;

    const includePayment = query.input.includePayment ?? true;
    const includeShipment = query.input.includeShipment ?? true;
    const includeReservations = query.input.includeReservations ?? true;

    const order = await this.queryBus.execute<GetOrderQuery, OrderView | null>(
      new GetOrderQuery(orderId),
    );
    if (!order) return null;

    const partialErrors: string[] = [];

    const paymentPromise =
      includePayment && order.paymentId
        ? this.queryBus.execute<
            GetPaymentIntentQuery,
            PaymentIntentView | null
          >(new GetPaymentIntentQuery(order.paymentId))
        : Promise.resolve(null);

    const shipmentPromise = includeShipment
      ? this.queryBus.execute<GetShipmentByOrderQuery, ShipmentView | null>(
          new GetShipmentByOrderQuery(orderId),
        )
      : Promise.resolve(null);

    const reservationsPromise = includeReservations
      ? this.queryBus.execute<
          ListInventoryReservationsQuery,
          InventoryReservationView[]
        >(new ListInventoryReservationsQuery(orderId))
      : Promise.resolve([]);

    const [paymentSettled, shipmentSettled, reservationsSettled] =
      await Promise.allSettled([
        paymentPromise,
        shipmentPromise,
        reservationsPromise,
      ]);

    const paymentIntent =
      paymentSettled.status === 'fulfilled'
        ? paymentSettled.value
        : (partialErrors.push('paymentIntent'), null);

    const shipment =
      shipmentSettled.status === 'fulfilled'
        ? shipmentSettled.value
        : (partialErrors.push('shipment'), null);

    const reservations =
      reservationsSettled.status === 'fulfilled'
        ? reservationsSettled.value
        : (partialErrors.push('reservations'), []);

    return {
      order,
      paymentIntent,
      shipment,
      reservations,
      partialErrors: partialErrors.length ? partialErrors : undefined,
    };
  }
}
