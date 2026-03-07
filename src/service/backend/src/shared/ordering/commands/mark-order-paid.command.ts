import { Command } from '@nestjs/cqrs';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/common/cqrs/input-normalizer';

export class MarkOrderPaidCommand extends Command<void> {
	public readonly orderId: string;

	constructor(input: { orderId: string }) {
		super();
		this.orderId = requireTrimmedString(
			input.orderId,
			ORDERING_APPLICATION_ERRORS.ORDER_ID_REQUIRED,
		);
	}
}
