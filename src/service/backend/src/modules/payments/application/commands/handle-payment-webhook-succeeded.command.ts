import { Command } from '@nestjs/cqrs';
import { PaymentWebhookPayloadInvalidException } from '@/shared/exceptions';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';
import { toTrimmedString } from '@/common/cqrs/input-normalizer';

export class HandlePaymentWebhookSucceededCommand extends Command<void> {
	readonly orderId: string;
	readonly paymentId: string;

	constructor(input: { orderId: string; paymentId: string }) {
		super();
		const orderId = toTrimmedString(input.orderId);
		if (!orderId) {
			throw ApplicationExceptionFactory.create(
				PaymentWebhookPayloadInvalidException,
			);
		}

		const paymentId = toTrimmedString(input.paymentId);
		if (!paymentId) {
			throw ApplicationExceptionFactory.create(
				PaymentWebhookPayloadInvalidException,
			);
		}

		this.orderId = orderId;
		this.paymentId = paymentId;
	}
}
