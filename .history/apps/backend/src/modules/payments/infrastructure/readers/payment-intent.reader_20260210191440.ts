import { Inject, Injectable } from '@nestjs/common';
import {
  IPaymentIntentReaderSymbol,
  type IPaymentIntentReader,
  type PaymentIntentView,
} from '../../../../shared/payments';
import { IPaymentRepositorySymbol } from '../../domains/repositories/i.payment.repository';
import type { IPaymentRepository } from '../../domains/repositories/i.payment.repository';

@Injectable()
export class PaymentIntentReader implements IPaymentIntentReader {
  constructor(
    @Inject(IPaymentRepositorySymbol)
    private readonly payments: IPaymentRepository,
  ) {}

  async findById(paymentId: string): Promise<PaymentIntentView | null> {
    const payment = await this.payments.findById(paymentId);
    if (!payment) return null;
    return this.toView(payment);
  }

  async findRecent(limit: number): Promise<PaymentIntentView[]> {
    const safeLimit = Math.min(50, Math.max(1, Number(limit ?? 20)));
    const payments = await this.payments.findRecent(safeLimit);
    return payments.map((p) => this.toView(p));
  }

  private toView(payment: {
    toPrimitives(): {
      paymentId: string;
      orderId: string;
      amount: number;
      currency: string;
      status: PaymentIntentView['status'];
      createdAt: Date;
      updatedAt: Date;
    };
  }): PaymentIntentView {
    return payment.toPrimitives();
  }
}

export const PaymentIntentReaderProvider = {
  provide: IPaymentIntentReaderSymbol,
  useClass: PaymentIntentReader,
};
