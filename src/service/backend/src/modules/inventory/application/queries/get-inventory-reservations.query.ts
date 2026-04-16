import { Query } from '@nestjs/cqrs';
import type { InventoryReservationResult } from '@/modules/inventory/domain/readers/inventory-reservation.result';
import { InventoryOrderIdRequiredException } from '@/shared/exceptions';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';
import { toTrimmedString } from '@/common/cqrs/input-normalizer';

export class GetInventoryReservationsQuery extends Query<
	InventoryReservationResult[]
> {
	public readonly orderId: string;

	constructor(input: { orderId: string }) {
		super();
		const orderId = toTrimmedString(input.orderId);
		if (!orderId) {
			throw ApplicationExceptionFactory.create(
				InventoryOrderIdRequiredException,
			);
		}

		this.orderId = orderId;
	}
}
