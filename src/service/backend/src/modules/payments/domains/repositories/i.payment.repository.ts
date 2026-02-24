import { PaymentIntent } from '@/modules/payments/domains/entities/aggregates/payment-intent/payment-intent.aggregate';

export interface IPaymentRepository {
	createIntent(input: {
		orderId: string;
		amount: number;
		currency: string;
	}): Promise<PaymentIntent>;

	markSucceeded(paymentId: string): Promise<void>;
	markFailed(paymentId: string): Promise<void>;

	findById(paymentId: string): Promise<PaymentIntent | null>;

	findRecent(limit: number): Promise<PaymentIntent[]>;
}

export const IPaymentRepositorySymbol = Symbol('I_PAYMENT_REPOSITORY');
