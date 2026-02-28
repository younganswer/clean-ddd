import { PaymentIntent } from '@/modules/payments/domains/entities/aggregates/payment-intent/payment-intent.aggregate';

export interface IPaymentRepository {
	persist(payment: PaymentIntent): Promise<void>;

	findById(paymentId: string): Promise<PaymentIntent | null>;

	findRecent(limit: number): Promise<PaymentIntent[]>;
}

export const IPaymentRepositorySymbol = Symbol('I_PAYMENT_REPOSITORY');
