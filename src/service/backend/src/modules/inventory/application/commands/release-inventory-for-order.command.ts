import { Command } from '@nestjs/cqrs';
import { INVENTORY_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/common/cqrs/input-normalizer';

export class ReleaseInventoryForOrderCommand extends Command<void> {
	public readonly orderId: string;

	constructor(input: { orderId: string }) {
		super();
		this.orderId = requireTrimmedString(
			input.orderId,
			INVENTORY_APPLICATION_ERRORS.INVENTORY_ORDER_ID_REQUIRED,
		);
	}
}
