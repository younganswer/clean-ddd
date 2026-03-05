import { Query } from '@nestjs/cqrs';
import type { InventoryReservationResult } from '@/shared/readers/inventory/dto/inventory-reservation.result';
import { INVENTORY_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/shared/cqrs/input-normalizer';

export class GetInventoryReservationsQuery extends Query<
	InventoryReservationResult[]
> {
	public readonly orderId: string;

	constructor(input: { orderId: string }) {
		super();
		this.orderId = requireTrimmedString(
			input.orderId,
			INVENTORY_APPLICATION_ERRORS.INVENTORY_ORDER_ID_REQUIRED,
		);
	}
}
