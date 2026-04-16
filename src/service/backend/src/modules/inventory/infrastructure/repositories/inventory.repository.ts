import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { RepositoryPageOptions } from '@/lib/database/repository-get-options';
import {
	IInventoryItemRepositorySymbol,
	type IInventoryItemRepository,
} from '@/modules/inventory/domains/repositories/i.inventory-item.repository';
import { InventoryItem } from '@/modules/inventory/domains/entities/inventory-item.entity';
import { InventoryItemMapper } from '@/modules/inventory/infrastructure/mappers/inventory-item.mapper';
import { InventoryItemSchema } from '@/modules/inventory/infrastructure/schemas/inventory-item.schema';
import { SystemRequestContextTransactionRequiredException } from '@/shared/exceptions/catalogs/system.exception';
import { InfrastructureExceptionFactory } from '@/common/exceptions/base.exception-factory';
import { useClassProviders } from '@/common/utils/nest-provider.helpers';

@Injectable()
export class InventoryItemRepository implements IInventoryItemRepository {
	constructor(
		private readonly em: EntityManager,
		private readonly mapper: InventoryItemMapper,
	) {}

	private emForContext(): EntityManager {
		return (
			(RequestContext.getEntityManager() as EntityManager | undefined) ??
			this.em
		);
	}

	private transactionalEmForWrite(method: string): EntityManager {
		const em = RequestContext.getEntityManager() as
			| EntityManager
			| undefined;
		if (!em) {
			throw InfrastructureExceptionFactory.create(
				SystemRequestContextTransactionRequiredException,
				{
					cause: {
						repository: InventoryItemRepository.name,
						method,
					},
				},
			);
		}
		return em;
	}

	async seedIfEmpty(): Promise<void> {
		const em = this.transactionalEmForWrite('seedIfEmpty');
		const count = await em.count(InventoryItemSchema, {});
		if (count > 0) return;

		const items: InventoryItemSchema[] = [];
		for (let i = 1; i <= 10; i += 1) {
			const sku = `SKU-${String(i).padStart(3, '0')}`;
			items.push(
				new InventoryItemSchema({
					uuid: randomUUID(),
					sku,
					priceCurrency: i % 2 === 0 ? 'USD' : 'KRW',
					priceAmountMinor: 100 + i * 137,
					availableQuantity: 1000,
					reservedQuantity: 0,
				}),
			);
		}

		em.persist(items);
	}

	async findRecent(
		options: RepositoryPageOptions<InventoryItem>,
	): Promise<InventoryItem[]> {
		const { limit, offset = 0 } = options;
		const em = this.emForContext();
		const found = await em.find(
			InventoryItemSchema,
			{},
			{
				limit,
				offset,
				orderBy: { id: 'asc' },
			},
		);

		return found.map((i) => this.mapper.toDomain(i));
	}

	async countItems(): Promise<number> {
		const em = this.emForContext();
		return await em.count(InventoryItemSchema, {});
	}

	async findBySku(sku: string): Promise<InventoryItem | null> {
		const em = this.emForContext();
		const found = await em.findOne(InventoryItemSchema, { sku });
		return found ? this.mapper.toDomain(found) : null;
	}

	async persist(item: InventoryItem): Promise<void> {
		const em = this.transactionalEmForWrite('persist');
		const schema = this.mapper.toSchema(item);
		const exists = await em.findOne(InventoryItemSchema, {
			sku: schema.sku,
		});

		if (exists) {
			em.assign(exists, schema, {
				ignoreUndefined: true,
				onlyProperties: true,
			});
		} else {
			em.create(InventoryItemSchema, schema);
		}
	}
}

export const InventoryItemRepositoryProviders = useClassProviders(
	IInventoryItemRepositorySymbol,
	InventoryItemRepository,
);
