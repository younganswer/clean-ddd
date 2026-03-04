import { Query } from '@nestjs/cqrs';
import type { PaymentIntentView } from '@/shared/readers/payments/dto/payment-intent.view';
import { PAYMENTS_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/shared/cqrs/input-normalizer';

export class GetPaymentIntentQuery extends Query<PaymentIntentView | null> {
	public readonly paymentId: string;

	constructor(paymentId: string) {
		super();
		this.paymentId = requireTrimmedString(
			paymentId,
			PAYMENTS_APPLICATION_ERRORS.PAYMENT_ORDER_ID_REQUIRED,
			{ reason: 'paymentId' },
		);
	}
}
