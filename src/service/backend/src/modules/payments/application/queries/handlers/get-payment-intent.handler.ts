import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetPaymentIntentQuery,
  IPaymentIntentReaderSymbol,
  type IPaymentIntentReader,
  type PaymentIntentView,
} from '../../../../../shared/payments';

@QueryHandler(GetPaymentIntentQuery)
export class GetPaymentIntentHandler implements IQueryHandler<GetPaymentIntentQuery> {
  constructor(
    @Inject(IPaymentIntentReaderSymbol)
    private readonly payments: IPaymentIntentReader,
  ) {}

  async execute(
    query: GetPaymentIntentQuery,
  ): Promise<PaymentIntentView | null> {
    return this.payments.findById(query.paymentId);
  }
}
