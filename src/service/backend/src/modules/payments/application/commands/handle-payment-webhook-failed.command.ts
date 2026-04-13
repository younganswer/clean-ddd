import { Command } from '@nestjs/cqrs';
import { PaymentWebhookPayloadInvalidException } from '@/shared/exceptions';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';
import { toTrimmedString } from '@/common/cqrs/input-normalizer';

export class HandlePaymentWebhookFailedCommand extends Command<void> {
	readonly paymentId: string;

	constructor(input: { paymentId: string }) {
		super();
		const paymentId = toTrimmedString(input.paymentId);
		if (!paymentId) {
			throw ApplicationExceptionFactory.create(
				PaymentWebhookPayloadInvalidException,
			);
		}

		this.paymentId = paymentId;
	}
}
