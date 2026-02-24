import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { IOrderRepository } from '@/modules/ordering/domains/repositories/i.order.repository';
import { OrderStatus } from '@/shared/ordering/enums/order-status.enum';
import { Order } from '@/modules/ordering/domains/entities/aggregates/order/order.aggregate';
import { OrderMapper } from '@/modules/ordering/infrastructure/mappers/order.mapper';
import { OrderSchema } from '@/modules/ordering/infrastructure/schemas/order.schema';

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

	create(input: {
		amount: number;
		currency: string;
		items?: Array<{ sku: string; quantity: number }>;
		userId: string;
	}): Promise<Order> {
		const em = this.emForContext();
		const order = em.create(OrderSchema, {
			amount: input.amount,
			currency: input.currency,
			items: input.items?.length
				? input.items
				: [{ sku: 'SKU-001', quantity: 1 }],
			userId: input.userId,
			status: OrderStatus.PENDING_PAYMENT,
			paymentId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		em.persist(order);
		return em.flush().then(() => this.mapper.toDomain(order));
	}

	async findById(orderId: string): Promise<Order | null> {
		const em = this.emForContext();
		const found = await em.findOne(OrderSchema, { uuid: orderId });
		return found ? this.mapper.toDomain(found) : null;
	}

	async findRecent(limit: number, offset: number = 0): Promise<Order[]> {
		const em = this.emForContext();
		const found = await em.find(
			OrderSchema,
			{},
			{
				limit,
				offset: Math.max(0, Number(offset ?? 0) || 0),
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
		const safeLimit = Math.min(200, Math.max(1, Number(limit ?? 50) || 50));
		const safeOffset = Math.max(0, Number(offset ?? 0) || 0);
		const found = await em.find(
			OrderSchema,
			{ userId: normalized },
			{
				limit: safeLimit,
				offset: safeOffset,
				orderBy: { id: 'asc' },
			},
		);
		return found.map((o) => this.mapper.toDomain(o));
	}

	async countAll(): Promise<number> {
		const em = this.emForContext();
		return await em.count(OrderSchema, {});
	}

	async attachPayment(orderId: string, paymentId: string): Promise<void> {
		const em = this.emForContext();
		const order = await em.findOneOrFail(OrderSchema, { uuid: orderId });
		order.paymentId = paymentId;
		order.updatedAt = new Date();
		em.persist(order);
	}

	async markPaid(orderId: string): Promise<void> {
		const em = this.emForContext();
		const order = await em.findOneOrFail(OrderSchema, { uuid: orderId });
		order.status = OrderStatus.PAID;
		order.updatedAt = new Date();
		em.persist(order);
	}
}
