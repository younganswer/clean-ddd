import { Command } from '@nestjs/cqrs';
import { PAYMENTS_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/common/cqrs/input-normalizer';

export class HandlePaymentWebhookSucceededCommand extends Command<void> {
	readonly orderId: string;
	readonly paymentId: string;

	constructor(input: { orderId: string; paymentId: string }) {
		super();
		this.orderId = requireTrimmedString(
			input.orderId,
			PAYMENTS_APPLICATION_ERRORS.PAYMENT_WEBHOOK_PAYLOAD_INVALID,
		);
		this.paymentId = requireTrimmedString(
			input.paymentId,
			PAYMENTS_APPLICATION_ERRORS.PAYMENT_WEBHOOK_PAYLOAD_INVALID,
		);
	}
}
