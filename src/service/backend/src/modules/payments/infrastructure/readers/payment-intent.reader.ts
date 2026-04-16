import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import {
	IPaymentIntentReaderSymbol,
	type IPaymentIntentReader,
} from '@/modules/payments/domain/readers/i.payment-intent.reader';
import type { PageOptions } from '@/lib/database/repository-get-options';
import { PaymentIntentResult } from '@/modules/payments/domain/readers/payment-intent.result';
import { PaymentIntentSchema } from '@/modules/payments/infrastructure/schemas/payment-intent.schema';
import { normalizeReaderExternalPage } from '@/common/cqrs/pagination-policy';
import { useClassProvider } from '@/common/utils/nest-provider.helpers';

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

	async findRecent(
		options: PageOptions<PaymentIntentResult>,
	): Promise<PaymentIntentResult[]> {
		const page = normalizeReaderExternalPage(options.limit, options.offset);
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

export const PaymentIntentReaderProvider = useClassProvider(
	IPaymentIntentReaderSymbol,
	PaymentIntentReader,
);
