import { Query } from '@nestjs/cqrs';
import type { ShipmentView } from './shipment.view';

export class ListShipmentsQuery extends Query<ShipmentView[]> {
  constructor(public readonly limit: number) {
    super();
  }
}
