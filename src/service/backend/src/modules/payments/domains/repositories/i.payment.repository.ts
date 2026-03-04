import { PaymentIntent } from '@/modules/payments/domains/entities/aggregates/payment-intent/payment-intent.aggregate';
import type { RepositoryGetByIdOptions } from '@/lib/database/repository-get-options';

export interface IPaymentRepository {
	persist(payment: PaymentIntent): Promise<void>;
	findById(id: string): Promise<PaymentIntent | null>;

	getById(
		id: string,
		options?: RepositoryGetByIdOptions,
	): Promise<PaymentIntent>;

	findRecent(limit: number): Promise<PaymentIntent[]>;
}

export const IPaymentRepositorySymbol = Symbol('I_PAYMENT_REPOSITORY');
