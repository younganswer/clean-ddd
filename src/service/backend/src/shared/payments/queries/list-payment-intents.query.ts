import { Query } from '@nestjs/cqrs';
import type { PaymentIntentResult } from '@/shared/readers/payments/dto/payment-intent.result';
import { toBoundedInt } from '@/shared/cqrs/input-normalizer';

export class ListPaymentIntentsQuery extends Query<PaymentIntentResult[]> {
	public readonly limit: number;

	constructor(limit: number) {
		super();
		this.limit = toBoundedInt(limit, {
			min: 1,
			max: 50,
			fallback: 20,
		});
	}
}
