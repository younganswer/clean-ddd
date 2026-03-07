import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
	IPaymentIntentReaderSymbol,
	type IPaymentIntentReader,
} from '@/modules/payments/domains/readers/i.payment-intent.reader';
import { GetPaymentIntentsQuery } from '@/modules/payments/application/queries/get-payment-intents.query';
import type { PaymentIntentResult } from '@/modules/payments/domains/readers/payment-intent.result';

@QueryHandler(GetPaymentIntentsQuery)
export class ListPaymentIntentsHandler implements IQueryHandler<GetPaymentIntentsQuery> {
	constructor(
		@Inject(IPaymentIntentReaderSymbol)
		private readonly paymentRepository: IPaymentIntentReader,
	) {}

	async execute(
		query: GetPaymentIntentsQuery,
	): Promise<PaymentIntentResult[]> {
		return this.paymentRepository.findRecent(query.limit);
	}
}
