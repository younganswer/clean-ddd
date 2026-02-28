import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
	IPaymentIntentReaderSymbol,
	ListPaymentIntentsQuery,
	type IPaymentIntentReader,
	type PaymentIntentView,
} from '@/shared/payments';

@QueryHandler(ListPaymentIntentsQuery)
export class ListPaymentIntentsHandler implements IQueryHandler<ListPaymentIntentsQuery> {
	constructor(
		@Inject(IPaymentIntentReaderSymbol)
		private readonly paymentRepository: IPaymentIntentReader,
	) {}

	async execute(
		query: ListPaymentIntentsQuery,
	): Promise<PaymentIntentView[]> {
		return this.paymentRepository.findRecent(query.limit);
	}
}
