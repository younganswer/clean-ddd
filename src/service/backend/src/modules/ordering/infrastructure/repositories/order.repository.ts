import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { RepositoryGetByIdOptions } from '@/lib/database/repository-get-options';
import type { IOrderRepository } from '@/modules/ordering/domains/repositories/i.order.repository';
import { Order } from '@/modules/ordering/domains/entities/aggregates/order/order.aggregate';
import { OrderMapper } from '@/modules/ordering/infrastructure/mappers/order.mapper';
import { OrderSchema } from '@/modules/ordering/infrastructure/schemas/order.schema';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import { SYSTEM_INFRA_ERRORS } from '@/shared/errors/catalogs/system.errors';
import {
	ApplicationErrorFactory,
	InfrastructureErrorFactory,
} from '@/common/errors/base.error-factory';

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
			throw InfrastructureErrorFactory.create(
				SYSTEM_INFRA_ERRORS.REQUEST_CONTEXT_TRANSACTION_REQUIRED,
				{
					details: {
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
				ApplicationErrorFactory.create(
					ORDERING_APPLICATION_ERRORS.ORDER_NOT_FOUND,
					{ details: { id } },
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

	async findRecent(limit: number, offset: number = 0): Promise<Order[]> {
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
		limit: number,
		offset: number = 0,
	): Promise<Order[]> {
		const normalized = String(userId ?? '').trim();
		if (!normalized) return [];

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
