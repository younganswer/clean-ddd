import { Query } from '@nestjs/cqrs';
import type { PaymentIntentResult } from '@/modules/payments/domain/readers/payment-intent.result';
import { PaymentOrderIdRequiredException } from '@/shared/exceptions';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';
import { toTrimmedString } from '@/common/cqrs/input-normalizer';

export class GetPaymentIntentQuery extends Query<PaymentIntentResult | null> {
	public readonly paymentId: string;

	constructor(input: { paymentId: string }) {
		super();
		const paymentId = toTrimmedString(input.paymentId);
		if (!paymentId) {
			throw ApplicationExceptionFactory.create(
				PaymentOrderIdRequiredException,
				{ description: 'paymentId' },
			);
		}

		this.paymentId = paymentId;
	}
}
