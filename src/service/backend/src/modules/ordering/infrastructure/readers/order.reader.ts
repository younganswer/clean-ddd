import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import {
	IOrderReaderSymbol,
	type IOrderReader,
} from '@/modules/ordering/application/readers/i.order.reader';
import { OrderResult } from '@/modules/ordering/application/readers/order.result';
import { OrderSchema } from '@/modules/ordering/infrastructure/schemas/order.schema';
import { RepositoryGetByIdOptions } from '@/lib/database/repository-get-options';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/common/errors/base.error-factory';

@Injectable()
export class OrderReader implements IOrderReader {
	constructor(private readonly em: EntityManager) {}

	private emForContext(): EntityManager {
		return (
			(RequestContext.getEntityManager() as EntityManager | undefined) ??
			this.em
		);
	}

	async findById(id: string): Promise<OrderResult | null> {
		const order = await this.emForContext().findOne(OrderSchema, {
			uuid: id,
		});
		if (!order) return null;

		return OrderResult.fromSchema(order);
	}

	async getById(
		id: string,
		options?: RepositoryGetByIdOptions,
	): Promise<OrderResult> {
		const failHandler =
			options?.failHandler ??
			(() =>
				ApplicationErrorFactory.create(
					ORDERING_APPLICATION_ERRORS.ORDER_NOT_FOUND,
					{ details: { id } },
				));
		const order = await this.emForContext().findOneOrFail(
			OrderSchema,
			{ uuid: id },
			{ failHandler },
		);

		return OrderResult.fromSchema(order);
	}

	async findRecent(
		limit: number,
		offset: number = 0,
	): Promise<OrderResult[]> {
		const safeLimit = Math.min(50, Math.max(1, Number(limit ?? 20)));
		const safeOffset = Math.max(0, Number(offset ?? 0) || 0);
		const orders = await this.emForContext().find(
			OrderSchema,
			{},
			{
				limit: safeLimit,
				offset: safeOffset,
				orderBy: { id: 'asc' },
			},
		);
		return orders.map((order) => OrderResult.fromSchema(order));
	}

	async findByUserId(
		userId: string,
		limit: number,
		offset: number = 0,
	): Promise<OrderResult[]> {
		const normalized = String(userId ?? '').trim();
		if (!normalized) return [];

		const safeLimit = Math.min(200, Math.max(1, Number(limit ?? 50) || 50));
		const safeOffset = Math.max(0, Number(offset ?? 0) || 0);
		const orders = await this.emForContext().find(
			OrderSchema,
			{ userId: normalized },
			{
				limit: safeLimit,
				offset: safeOffset,
				orderBy: { id: 'asc' },
			},
		);
		return orders.map((order) => OrderResult.fromSchema(order));
	}

	async countAll(): Promise<number> {
		return await this.emForContext().count(OrderSchema, {});
	}
}

export const OrderReaderProvider = {
	provide: IOrderReaderSymbol,
	useClass: OrderReader,
};
