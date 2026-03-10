import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import {
	IPaymentIntentReaderSymbol,
	type IPaymentIntentReader,
} from '@/modules/payments/domains/readers/i.payment-intent.reader';
import { PaymentIntentResult } from '@/modules/payments/domains/readers/payment-intent.result';
import { PaymentIntentSchema } from '@/modules/payments/infrastructure/schemas/payment-intent.schema';
import { normalizeReaderExternalPage } from '@/common/cqrs/pagination-policy';

@Injectable()
export class PaymentIntentReader implements IPaymentIntentReader {
	constructor(private readonly em: EntityManager) {}

	private emForContext(): EntityManager {
		return (
			(RequestContext.getEntityManager() as EntityManager | undefined) ??
			this.em
		);
	}

	async findById(id: string): Promise<PaymentIntentResult | null> {
		const payment = await this.emForContext().findOne(PaymentIntentSchema, {
			uuid: id,
		});
		if (!payment) return null;
		return PaymentIntentResult.fromSchema(payment);
	}

	async findRecent(limit: number): Promise<PaymentIntentResult[]> {
		const page = normalizeReaderExternalPage(limit, 0);
		const payments = await this.emForContext().find(
			PaymentIntentSchema,
			{},
			{
				orderBy: { id: 'asc' },
				limit: page.limit,
			},
		);
		return payments.map((payment) =>
			PaymentIntentResult.fromSchema(payment),
		);
	}
}

export const PaymentIntentReaderProvider = {
	provide: IPaymentIntentReaderSymbol,
	useClass: PaymentIntentReader,
};
