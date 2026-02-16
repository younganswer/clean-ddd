import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IInventoryRepositorySymbol } from '@/modules/inventory/domains/repositories/i.inventory.repository';
import type { IInventoryRepository } from '@/modules/inventory/domains/repositories/i.inventory.repository';
import {
  ListInventoryReservationsQuery,
  type InventoryReservationView,
} from '@/shared/inventory';

@QueryHandler(ListInventoryReservationsQuery)
export class ListInventoryReservationsHandler implements IQueryHandler<ListInventoryReservationsQuery> {
  constructor(
    @Inject(IInventoryRepositorySymbol)
    private readonly inventory: IInventoryRepository,
  ) {}

  async execute(
    query: ListInventoryReservationsQuery,
  ): Promise<InventoryReservationView[]> {
    const orderId = String(query.orderId ?? '').trim();
    if (!orderId) return [];

    const rows = await this.inventory.findReservationsByOrderId(orderId);
    return rows.map((r) => ({
      reservationId: r.uuid,
      orderId: r.orderId,
      sku: r.sku,
      quantity: r.quantity,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
