import { Command } from '@nestjs/cqrs';
import { OrderingOrderIdRequiredException } from '@/shared/exceptions';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';
import { toTrimmedString } from '@/common/cqrs/input-normalizer';

export class MarkOrderPaidCommand extends Command<void> {
	public readonly orderId: string;

	constructor(input: { orderId: string }) {
		super();
		const orderId = toTrimmedString(input.orderId);
		if (!orderId) {
			throw ApplicationExceptionFactory.create(
				OrderingOrderIdRequiredException,
			);
		}

		this.orderId = orderId;
	}
}
