import { Query } from '@nestjs/cqrs';
import type { ShipmentView } from './shipment.view';

export class GetShipmentQuery extends Query<ShipmentView | null> {
  constructor(public readonly shipmentId: string) {
    super();
  }
}
