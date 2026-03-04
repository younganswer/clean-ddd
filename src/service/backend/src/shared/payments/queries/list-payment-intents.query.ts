import { Query } from '@nestjs/cqrs';
import type { PaymentIntentView } from '@/shared/readers/payments/dto/payment-intent.view';
import { toBoundedInt } from '@/shared/cqrs/input-normalizer';

export class ListPaymentIntentsQuery extends Query<PaymentIntentView[]> {
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
