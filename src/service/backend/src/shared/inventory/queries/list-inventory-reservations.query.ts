import { Query } from '@nestjs/cqrs';
import type { InventoryReservationView } from '@/shared/readers/inventory/dto/inventory-reservation.view';

export class ListInventoryReservationsQuery extends Query<
	InventoryReservationView[]
> {
	constructor(public readonly orderId: string) {
		super();
	}
}
