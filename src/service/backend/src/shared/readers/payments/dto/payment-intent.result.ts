import type { PaymentStatus } from '@/shared/payments/enums/payment-status.enum';

export type PaymentIntentResult = {
	paymentId: string;
	orderId: string;
	amount: number;
	currency: string;
	status: PaymentStatus;
};
