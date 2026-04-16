import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type {
	RepositoryGetByIdOptions,
	RepositoryPageOptions,
} from '@/lib/database/repository-get-options';
import {
	IPaymentRepositorySymbol,
	type IPaymentRepository,
} from '@/modules/payments/domain/repositories/i.payment.repository';
import { PaymentIntent } from '@/modules/payments/domain/entities/aggregates/payment-intent/payment-intent.aggregate';
import { PaymentIntentMapper } from '@/modules/payments/infrastructure/mappers/payment-intent.mapper';
import { PaymentIntentSchema } from '@/modules/payments/infrastructure/schemas/payment-intent.schema';
import { PaymentNotFoundException } from '@/shared/exceptions';
import { SystemRequestContextTransactionRequiredException } from '@/shared/exceptions/catalogs/system.exception';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';
import { InfrastructureExceptionFactory } from '@/common/exceptions/base.exception-factory';
import { useClassProviders } from '@/common/utils/nest-provider.helpers';

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
			throw InfrastructureExceptionFactory.create(
				SystemRequestContextTransactionRequiredException,
				{
					cause: {
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
				ApplicationExceptionFactory.create(PaymentNotFoundException, {
					cause: { id },
				}));
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

export const PaymentRepositoryProviders = useClassProviders(
	IPaymentRepositorySymbol,
	PaymentRepository,
);
