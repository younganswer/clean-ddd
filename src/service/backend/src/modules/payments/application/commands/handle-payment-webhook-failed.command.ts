import { Command } from '@nestjs/cqrs';
import { PAYMENTS_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/common/cqrs/input-normalizer';

export class HandlePaymentWebhookFailedCommand extends Command<void> {
	readonly paymentId: string;

	constructor(input: { paymentId: string }) {
		super();
		this.paymentId = requireTrimmedString(
			input.paymentId,
			PAYMENTS_APPLICATION_ERRORS.PAYMENT_WEBHOOK_PAYLOAD_INVALID,
		);
	}
}
