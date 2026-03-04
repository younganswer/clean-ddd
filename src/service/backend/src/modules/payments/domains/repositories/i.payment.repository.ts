import { PaymentIntent } from '@/modules/payments/domains/entities/aggregates/payment-intent/payment-intent.aggregate';
import type { RepositoryGetByIdOptions } from '@/lib/database/repository-get-options';

export interface IPaymentRepository {
	persist(payment: PaymentIntent): Promise<void>;
	findById(paymentId: string): Promise<PaymentIntent | null>;

	getById(
		paymentId: string,
		options?: RepositoryGetByIdOptions,
	): Promise<PaymentIntent>;

	findRecent(limit: number): Promise<PaymentIntent[]>;
}

export const IPaymentRepositorySymbol = Symbol('I_PAYMENT_REPOSITORY');
