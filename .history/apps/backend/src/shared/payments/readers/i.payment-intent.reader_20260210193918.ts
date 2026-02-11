import type { PaymentIntentView } from '../views/payment-intent.view';

export const IPaymentIntentReaderSymbol = Symbol('IPaymentIntentReader');

export interface IPaymentIntentReader {
  findById(paymentId: string): Promise<PaymentIntentView | null>;
  findRecent(limit: number): Promise<PaymentIntentView[]>;
}
