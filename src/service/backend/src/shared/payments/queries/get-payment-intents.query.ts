import { Query } from '@nestjs/cqrs';
import type { PaymentIntentResult } from '@/shared/payments/readers/dto/payment-intent.result';
import { toBoundedInt } from '@/common/cqrs/input-normalizer';

export class GetPaymentIntentsQuery extends Query<PaymentIntentResult[]> {
	public readonly limit: number;

	constructor(input: { limit?: number }) {
		super();
		this.limit = toBoundedInt(input.limit, {
			min: 1,
			max: 50,
			fallback: 20,
		});
	}
}
