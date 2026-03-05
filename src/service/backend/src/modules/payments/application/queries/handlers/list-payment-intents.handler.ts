import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
	IPaymentIntentReaderSymbol,
	GetPaymentIntentsQuery,
	type IPaymentIntentReader,
	type PaymentIntentResult,
} from '@/shared/payments';

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
