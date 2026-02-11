import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IShipmentRepositorySymbol } from '../../../domains/repositories/i.shipment.repository';
import type { IShipmentRepository } from '../../../domains/repositories/i.shipment.repository';
import { GetShipmentQuery } from '../get-shipment.query';
import type { ShipmentView } from '../shipment.view';

@QueryHandler(GetShipmentQuery)
export class GetShipmentHandler implements IQueryHandler<GetShipmentQuery> {
  constructor(
    @Inject(IShipmentRepositorySymbol)
    private readonly shipments: IShipmentRepository,
  ) {}

  async execute(query: GetShipmentQuery): Promise<ShipmentView | null> {
    const s = await this.shipments.findById(query.shipmentId);
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
