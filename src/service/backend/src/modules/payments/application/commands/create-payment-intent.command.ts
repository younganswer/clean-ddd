import { Command } from '@nestjs/cqrs';
import type { PaymentStatus } from '@/modules/payments/domain/enums/payment-status.enum';
import { PaymentOrderIdRequiredException } from '@/shared/exceptions';
import { toTrimmedString, toBoundedInt } from '@/common/cqrs/input-normalizer';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';

export type CreatePaymentIntentResult = {
	paymentId: string;
	status: PaymentStatus;
	scheduled: {
		eventType: string;
		delaySeconds: number;
		outboxId: string;
	};
};

export class CreatePaymentIntentCommand extends Command<CreatePaymentIntentResult> {
	public readonly orderId: string;
	public readonly simulateOutcome: 'SUCCEEDED' | 'FAILED';
	public readonly simulateDelaySeconds: number;

	constructor(input: {
		orderId: string;
		simulateOutcome?: 'SUCCEEDED' | 'FAILED';
		simulateDelaySeconds?: number;
	}) {
		super();
		const orderId = toTrimmedString(input.orderId);
		if (!orderId) {
			throw ApplicationExceptionFactory.create(
				PaymentOrderIdRequiredException,
			);
		}

		this.orderId = orderId;
		this.simulateOutcome =
			input.simulateOutcome === 'FAILED' ? 'FAILED' : 'SUCCEEDED';
		this.simulateDelaySeconds = toBoundedInt(input.simulateDelaySeconds, {
			min: 0,
			max: Number.MAX_SAFE_INTEGER,
			fallback: 10,
		});
	}
}
