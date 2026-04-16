import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPaymentIntentQuery } from '@/modules/payments/application/queries/get-payment-intent.query';
import {
	IPaymentIntentReaderSymbol,
	type IPaymentIntentReader,
} from '@/modules/payments/domain/readers/i.payment-intent.reader';
import type { PaymentIntentResult } from '@/modules/payments/domain/readers/payment-intent.result';

@QueryHandler(GetPaymentIntentQuery)
export class GetPaymentIntentHandler implements IQueryHandler<GetPaymentIntentQuery> {
	constructor(
		@Inject(IPaymentIntentReaderSymbol)
		private readonly paymentRepository: IPaymentIntentReader,
	) {}

	async execute(
		query: GetPaymentIntentQuery,
	): Promise<PaymentIntentResult | null> {
		return this.paymentRepository.findById(query.paymentId);
	}
}
