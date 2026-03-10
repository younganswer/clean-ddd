import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type {
	RepositoryGetByIdOptions,
	RepositoryPageOptions,
} from '@/lib/database/repository-get-options';
import type { IPaymentRepository } from '@/modules/payments/domains/repositories/i.payment.repository';
import { PaymentIntent } from '@/modules/payments/domains/entities/aggregates/payment-intent/payment-intent.aggregate';
import { PaymentIntentMapper } from '@/modules/payments/infrastructure/mappers/payment-intent.mapper';
import { PaymentIntentSchema } from '@/modules/payments/infrastructure/schemas/payment-intent.schema';
import { PAYMENTS_APPLICATION_ERRORS } from '@/shared/errors';
import { SYSTEM_INFRA_ERRORS } from '@/shared/errors/catalogs/system.errors';
import { ApplicationErrorFactory } from '@/common/errors/base.error-factory';
import { InfrastructureErrorFactory } from '@/common/errors/base.error-factory';

@Injectable()
export class PaymentRepository implements IPaymentRepository {
	constructor(
		private readonly em: EntityManager,
		private readonly mapper: PaymentIntentMapper,
	) {}

	private emForContext(): EntityManager {
		return (
			(RequestContext.getEntityManager() as EntityManager | undefined) ??
			this.em
		);
	}

	private transactionalEmForWrite(): EntityManager {
		const em = RequestContext.getEntityManager() as
			| EntityManager
			| undefined;
		if (!em) {
			throw InfrastructureErrorFactory.create(
				SYSTEM_INFRA_ERRORS.REQUEST_CONTEXT_TRANSACTION_REQUIRED,
				{
					details: {
						repository: PaymentRepository.name,
						method: 'persist',
					},
				},
			);
		}
		return em;
	}

	async persist(payment: PaymentIntent): Promise<void> {
		const em = this.transactionalEmForWrite();
		const schema = this.mapper.toSchema(payment);
		const exists = await em.findOne(PaymentIntentSchema, {
			uuid: schema.uuid,
		});

		if (exists) {
			em.assign(exists, schema, {
				ignoreUndefined: true,
				onlyProperties: true,
			});
		} else {
			em.create(PaymentIntentSchema, schema);
		}
	}

	async getById(
		id: string,
		options?: RepositoryGetByIdOptions,
	): Promise<PaymentIntent> {
		const em = this.emForContext();
		const failHandler =
			options?.failHandler ??
			(() =>
				ApplicationErrorFactory.create(
					PAYMENTS_APPLICATION_ERRORS.PAYMENT_NOT_FOUND,
					{ details: { id } },
				));
		const found = await em.findOneOrFail(
			PaymentIntentSchema,
			{ uuid: id },
			{ failHandler },
		);

		return this.mapper.toDomain(found);
	}

	async findById(id: string): Promise<PaymentIntent | null> {
		const em = this.emForContext();
		const found = await em.findOne(PaymentIntentSchema, {
			uuid: id,
		});
		return found ? this.mapper.toDomain(found) : null;
	}

	async findRecent(
		options: RepositoryPageOptions<PaymentIntent>,
	): Promise<PaymentIntent[]> {
		const { limit, offset = 0 } = options;
		const em = this.emForContext();
		const found = await em.find(
			PaymentIntentSchema,
			{},
			{
				orderBy: { id: 'asc' },
				limit,
				offset,
			},
		);
		return found.map((p) => this.mapper.toDomain(p));
	}
}
