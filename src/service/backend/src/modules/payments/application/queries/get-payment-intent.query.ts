import { Query } from '@nestjs/cqrs';
import type { PaymentIntentResult } from '@/modules/payments/domains/readers/payment-intent.result';
import { PAYMENTS_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/common/cqrs/input-normalizer';

export class GetPaymentIntentQuery extends Query<PaymentIntentResult | null> {
	public readonly paymentId: string;

	constructor(input: { paymentId: string }) {
		super();
		this.paymentId = requireTrimmedString(
			input.paymentId,
			PAYMENTS_APPLICATION_ERRORS.PAYMENT_ORDER_ID_REQUIRED,
			{ reason: 'paymentId' },
		);
	}
}
