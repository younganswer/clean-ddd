import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { ListOrdersQuery } from '../../../../../shared/ordering/queries/list-orders.query';
import type { OrderView } from '../../../../../shared/ordering/readers/order.view';

import { ListPaymentIntentsQuery } from '../../../../../shared/payments/queries/list-payment-intents.query';
import type { PaymentIntentView } from '../../../../../shared/readers/payments/dto/payment-intent.view';

import { ListShipmentsQuery } from '../../../../../shared/shipping/queries/list-shipments.query';
import type { ShipmentView } from '../../../../../shared/readers/shipping/dto/shipment.view';

import { ListInventoryItemsQuery } from '../../../../../shared/inventory/queries/list-inventory-items.query';
import type { InventoryItemView } from '../../../../../shared/readers/inventory/dto/inventory-item.view';

import {
  GetDashboardSummaryBffQuery,
  type DashboardSummaryBffView,
} from '../get-dashboard-summary-bff.query';

@QueryHandler(GetDashboardSummaryBffQuery)
export class GetDashboardSummaryBffHandler
  implements IQueryHandler<GetDashboardSummaryBffQuery>
{
  constructor(private readonly queryBus: QueryBus) {}

  async execute(
    query: GetDashboardSummaryBffQuery,
  ): Promise<DashboardSummaryBffView> {
    const limit = Math.min(50, Math.max(1, Number(query.input.limit ?? 10)));

    const partialErrors: string[] = [];

    const [ordersSettled, paymentsSettled, shipmentsSettled, inventorySettled] =
      await Promise.allSettled([
        this.queryBus.execute<ListOrdersQuery, OrderView[]>(
          new ListOrdersQuery(limit),
        ),
        this.queryBus.execute<ListPaymentIntentsQuery, PaymentIntentView[]>(
          new ListPaymentIntentsQuery(limit),
        ),
        this.queryBus.execute<ListShipmentsQuery, ShipmentView[]>(
          new ListShipmentsQuery(limit),
        ),
        this.queryBus.execute<ListInventoryItemsQuery, InventoryItemView[]>(
          new ListInventoryItemsQuery(limit),
        ),
      ]);

    const orders =
      ordersSettled.status === 'fulfilled'
        ? ordersSettled.value
        : (partialErrors.push('orders'), []);

    const paymentIntents =
      paymentsSettled.status === 'fulfilled'
        ? paymentsSettled.value
        : (partialErrors.push('paymentIntents'), []);

    const shipments =
      shipmentsSettled.status === 'fulfilled'
        ? shipmentsSettled.value
        : (partialErrors.push('shipments'), []);

    const inventoryItems =
      inventorySettled.status === 'fulfilled'
        ? inventorySettled.value
        : (partialErrors.push('inventoryItems'), []);

    return {
      orders,
      paymentIntents,
      shipments,
      inventoryItems,
      partialErrors: partialErrors.length ? partialErrors : undefined,
    };
  }
}
