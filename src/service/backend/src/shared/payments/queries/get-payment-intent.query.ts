import { Query } from '@nestjs/cqrs';
import type { PaymentIntentView } from '@/shared/readers/payments/dto/payment-intent.view';

export class GetPaymentIntentQuery extends Query<PaymentIntentView | null> {
	constructor(public readonly paymentId: string) {
		super();
	}
}
