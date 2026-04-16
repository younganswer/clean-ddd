import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type {
	RepositoryGetByIdOptions,
	RepositoryPageOptions,
} from '@/lib/database/repository-get-options';
import {
	IOrderRepositorySymbol,
	type IOrderRepository,
} from '@/modules/ordering/domains/repositories/i.order.repository';
import { Order } from '@/modules/ordering/domains/entities/aggregates/order/order.aggregate';
import { OrderMapper } from '@/modules/ordering/infrastructure/mappers/order.mapper';
import { OrderSchema } from '@/modules/ordering/infrastructure/schemas/order.schema';
import { OrderingOrderNotFoundException } from '@/shared/exceptions';
import { SystemRequestContextTransactionRequiredException } from '@/shared/exceptions/catalogs/system.exception';
import {
	ApplicationExceptionFactory,
	InfrastructureExceptionFactory,
} from '@/common/exceptions/base.exception-factory';
import { useClassProviders } from '@/common/utils/nest-provider.helpers';

@Injectable()
export class OrderRepository implements IOrderRepository {
	constructor(
		private readonly em: EntityManager,
		private readonly mapper: OrderMapper,
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
						repository: OrderRepository.name,
						method: 'persist',
					},
				},
			);
		}
		return em;
	}

	async persist(order: Order): Promise<void> {
		const em = this.transactionalEmForWrite();
		const schema = this.mapper.toSchema(order);
		const exists = await em.findOne(OrderSchema, { uuid: schema.uuid });

		if (exists) {
			em.assign(exists, schema, {
				ignoreUndefined: true,
				onlyProperties: true,
			});
		} else {
			em.create(OrderSchema, schema);
		}
	}

	async getById(
		id: string,
		options?: RepositoryGetByIdOptions,
	): Promise<Order> {
		const em = this.emForContext();
		const failHandler =
			options?.failHandler ??
			(() =>
				ApplicationExceptionFactory.create(
					OrderingOrderNotFoundException,
					{ cause: { id } },
				));
		const found = await em.findOneOrFail(
			OrderSchema,
			{ uuid: id },
			{ failHandler },
		);

		return this.mapper.toDomain(found);
	}

	async findById(id: string): Promise<Order | null> {
		const em = this.emForContext();
		const found = await em.findOne(OrderSchema, { uuid: id });
		return found ? this.mapper.toDomain(found) : null;
	}

	async findRecent(options: RepositoryPageOptions<Order>): Promise<Order[]> {
		const { limit, offset = 0 } = options;
		const em = this.emForContext();
		const found = await em.find(
			OrderSchema,
			{},
			{
				limit,
				offset,
				orderBy: { id: 'asc' },
			},
		);

		return found.map((o) => this.mapper.toDomain(o));
	}

	async findByUserId(
		userId: string,
		options: RepositoryPageOptions<Order>,
	): Promise<Order[]> {
		const normalized = String(userId ?? '').trim();
		if (!normalized) return [];

		const { limit, offset = 0 } = options;

		const em = this.emForContext();
		const found = await em.find(
			OrderSchema,
			{ userId: normalized },
			{
				limit,
				offset,
				orderBy: { id: 'asc' },
			},
		);

		return found.map((o) => this.mapper.toDomain(o));
	}

	async countAll(): Promise<number> {
		const em = this.emForContext();

		return await em.count(OrderSchema, {});
	}
}

export const OrderRepositoryProviders = useClassProviders(
	IOrderRepositorySymbol,
	OrderRepository,
);
