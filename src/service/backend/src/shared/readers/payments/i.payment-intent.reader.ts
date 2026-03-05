import type { PaymentIntentResult } from '@/shared/readers/payments/dto/payment-intent.result';

export const IPaymentIntentReaderSymbol = Symbol('IPaymentIntentReader');

export interface IPaymentIntentReader {
	findById(id: string): Promise<PaymentIntentResult | null>;
	findRecent(limit: number): Promise<PaymentIntentResult[]>;
}
