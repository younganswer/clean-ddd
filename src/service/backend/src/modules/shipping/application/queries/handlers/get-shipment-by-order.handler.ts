import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IShipmentRepositorySymbol } from '@/modules/shipping/domains/repositories/i.shipment.repository';
import type { IShipmentRepository } from '@/modules/shipping/domains/repositories/i.shipment.repository';
import { GetShipmentByOrderQuery, type ShipmentView } from '@/shared/shipping';

@QueryHandler(GetShipmentByOrderQuery)
export class GetShipmentByOrderHandler implements IQueryHandler<GetShipmentByOrderQuery> {
  constructor(
    @Inject(IShipmentRepositorySymbol)
    private readonly shipments: IShipmentRepository,
  ) {}

  async execute(query: GetShipmentByOrderQuery): Promise<ShipmentView | null> {
    const s = await this.shipments.findByOrderId(query.orderId);
    if (!s) return null;

    return {
      shipmentId: s.id,
      orderId: s.orderId,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }
}
