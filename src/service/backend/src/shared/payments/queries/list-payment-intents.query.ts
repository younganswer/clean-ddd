import { Query } from '@nestjs/cqrs';
import type { PaymentIntentView } from '@/shared/readers/payments/dto/payment-intent.view';

export class ListPaymentIntentsQuery extends Query<PaymentIntentView[]> {
	constructor(public readonly limit: number) {
		super();
	}
}
