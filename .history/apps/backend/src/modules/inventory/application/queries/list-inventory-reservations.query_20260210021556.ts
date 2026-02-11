import { Query } from '@nestjs/cqrs';
import type { InventoryReservationView } from './inventory-reservation.view';

export class ListInventoryReservationsQuery extends Query<InventoryReservationView[]> {
  constructor(public readonly orderId: string) {
    super();
  }
}
