import { Command } from '@nestjs/cqrs';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/common/cqrs/input-normalizer';

export class AttachPaymentToOrderCommand extends Command<void> {
	public readonly orderId: string;
	public readonly paymentId: string;

	constructor(input: { orderId: string; paymentId: string }) {
		super();
		this.orderId = requireTrimmedString(
			input.orderId,
			ORDERING_APPLICATION_ERRORS.ORDER_ID_REQUIRED,
		);
		this.paymentId = requireTrimmedString(
			input.paymentId,
			ORDERING_APPLICATION_ERRORS.PAYMENT_ID_REQUIRED,
		);
	}
}
