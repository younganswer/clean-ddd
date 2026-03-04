import { Query } from '@nestjs/cqrs';
import type { InventoryReservationView } from '@/shared/readers/inventory/dto/inventory-reservation.view';
import { INVENTORY_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/shared/cqrs/input-normalizer';

export class ListInventoryReservationsQuery extends Query<
	InventoryReservationView[]
> {
	public readonly orderId: string;

	constructor(orderId: string) {
		super();
		this.orderId = requireTrimmedString(
			orderId,
			INVENTORY_APPLICATION_ERRORS.INVENTORY_ORDER_ID_REQUIRED,
		);
	}
}
