import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
	GetPaymentIntentQuery,
	IPaymentIntentReaderSymbol,
	type IPaymentIntentReader,
	type PaymentIntentResult,
} from '@/shared/payments';

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
