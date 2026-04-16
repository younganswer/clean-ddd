import type { PaymentStatus } from '@/modules/payments/domain/enums/payment-status.enum';

type PaymentIntentSchema = {
	uuid: string;
	orderId: string;
	amount: number;
	currency: string;
	status: PaymentStatus;
};

export class PaymentIntentResult {
	constructor(
		public readonly paymentId: string,
		public readonly orderId: string,
		public readonly amount: number,
		public readonly currency: string,
		public readonly status: PaymentStatus,
	) {}

	static fromSchema(schema: PaymentIntentSchema): PaymentIntentResult {
		return new PaymentIntentResult(
			schema.uuid,
			schema.orderId,
			schema.amount,
			schema.currency,
			schema.status,
		);
	}
}
