import { Command } from '@nestjs/cqrs';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/shared/cqrs/input-normalizer';

export class AttachPaymentToOrderCommand extends Command<void> {
	public readonly input: {
		orderId: string;
		paymentId: string;
	};

	constructor(input: { orderId: string; paymentId: string }) {
		super();
		this.input = {
			orderId: requireTrimmedString(
				input.orderId,
				ORDERING_APPLICATION_ERRORS.ORDER_ID_REQUIRED,
			),
			paymentId: requireTrimmedString(
				input.paymentId,
				ORDERING_APPLICATION_ERRORS.PAYMENT_ID_REQUIRED,
			),
		};
	}
}
