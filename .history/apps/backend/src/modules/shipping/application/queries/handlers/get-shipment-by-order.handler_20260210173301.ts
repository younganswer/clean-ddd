import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IShipmentRepositorySymbol } from '../../../domains/repositories/i.shipment.repository';
import type { IShipmentRepository } from '../../../domains/repositories/i.shipment.repository';
import { GetShipmentByOrderQuery } from '../get-shipment-by-order.query';
import type { ShipmentView } from '../shipment.view';

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
