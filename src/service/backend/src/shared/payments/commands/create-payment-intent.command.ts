import { Command } from '@nestjs/cqrs';
import type { PaymentStatus } from '@/shared/payments/enums/payment-status.enum';
import { PAYMENTS_APPLICATION_ERRORS } from '@/shared/errors';
import {
	requireTrimmedString,
	toBoundedInt,
} from '@/shared/cqrs/input-normalizer';

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
	public readonly input: {
		orderId: string;
		simulateOutcome: 'SUCCEEDED' | 'FAILED';
		simulateDelaySeconds: number;
	};

	constructor(input: {
		orderId: string;
		simulateOutcome?: 'SUCCEEDED' | 'FAILED';
		simulateDelaySeconds?: number;
	}) {
		super();
		const simulateOutcome =
			input.simulateOutcome === 'FAILED' ? 'FAILED' : 'SUCCEEDED';

		this.input = {
			orderId: requireTrimmedString(
				input.orderId,
				PAYMENTS_APPLICATION_ERRORS.PAYMENT_ORDER_ID_REQUIRED,
			),
			simulateOutcome,
			simulateDelaySeconds: toBoundedInt(input.simulateDelaySeconds, {
				min: 0,
				max: Number.MAX_SAFE_INTEGER,
				fallback: 10,
			}),
		};
	}
}
