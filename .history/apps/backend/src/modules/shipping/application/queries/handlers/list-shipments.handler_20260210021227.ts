import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IShipmentRepositorySymbol } from '../../../domains/repositories/i.shipment.repository';
import type { IShipmentRepository } from '../../../domains/repositories/i.shipment.repository';
import { ListShipmentsQuery } from '../list-shipments.query';
import type { ShipmentView } from '../shipment.view';

@QueryHandler(ListShipmentsQuery)
export class ListShipmentsHandler implements IQueryHandler<ListShipmentsQuery> {
  constructor(
    @Inject(IShipmentRepositorySymbol)
    private readonly shipments: IShipmentRepository,
  ) {}

  async execute(query: ListShipmentsQuery): Promise<ShipmentView[]> {
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
    const shipments = await this.shipments.findRecent(limit);

    return shipments.map((s) => ({
      shipmentId: s.id,
      orderId: s.orderId,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }
}
