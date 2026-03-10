import type { PageOptions } from '@/lib/database/repository-get-options';
import type { PaymentIntentResult } from '@/modules/payments/domains/readers/payment-intent.result';

export const IPaymentIntentReaderSymbol = Symbol('IPaymentIntentReader');

export interface IPaymentIntentReader {
	findById(id: string): Promise<PaymentIntentResult | null>;
	findRecent(
		options: PageOptions<PaymentIntentResult>,
	): Promise<PaymentIntentResult[]>;
}
