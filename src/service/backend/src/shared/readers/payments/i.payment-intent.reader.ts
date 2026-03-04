import type { PaymentIntentView } from '@/shared/readers/payments/dto/payment-intent.view';

export const IPaymentIntentReaderSymbol = Symbol('IPaymentIntentReader');

export interface IPaymentIntentReader {
	findById(id: string): Promise<PaymentIntentView | null>;
	findRecent(limit: number): Promise<PaymentIntentView[]>;
}
