import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import {
	IPaymentIntentReaderSymbol,
	type IPaymentIntentReader,
} from '@/shared/readers/payments/i.payment-intent.reader';
import { PaymentIntentResult } from '@/shared/readers/payments/dto/payment-intent.result';
import { PaymentIntentSchema } from '@/modules/payments/infrastructure/schemas/payment-intent.schema';

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
		const safeLimit = Math.min(50, Math.max(1, Number(limit ?? 20)));
		const payments = await this.emForContext().find(
			PaymentIntentSchema,
			{},
			{
				orderBy: { id: 'asc' },
				limit: safeLimit,
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
