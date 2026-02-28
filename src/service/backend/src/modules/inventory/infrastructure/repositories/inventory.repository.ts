import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { IInventoryItemRepository } from '@/modules/inventory/domains/repositories/i.inventory-item.repository';
import { InventoryItem } from '@/modules/inventory/domains/entities/inventory-item.entity';
import { InventoryItemMapper } from '@/modules/inventory/infrastructure/mappers/inventory-item.mapper';
import { InventoryItemSchema } from '@/modules/inventory/infrastructure/schemas/inventory-item.schema';

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

	async seedIfEmpty(): Promise<void> {
		const em = this.emForContext();
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

	async findAll(limit: number, offset: number = 0): Promise<InventoryItem[]> {
		const em = this.emForContext();
		const found = await em.find(
			InventoryItemSchema,
			{},
			{
				limit,
				offset: Math.max(0, Number(offset ?? 0) || 0),
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
		const em = this.emForContext();
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
