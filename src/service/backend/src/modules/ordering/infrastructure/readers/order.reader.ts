import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import {
	IOrderReaderSymbol,
	type IOrderReader,
} from '@/modules/ordering/domain/readers/i.order.reader';
import type { PageOptions } from '@/lib/database/repository-get-options';
import { OrderResult } from '@/modules/ordering/domain/readers/order.result';
import { OrderSchema } from '@/modules/ordering/infrastructure/schemas/order.schema';
import { RepositoryGetByIdOptions } from '@/lib/database/repository-get-options';
import {
	normalizeReaderExternalPage,
	normalizeReaderInternalPage,
} from '@/common/cqrs/pagination-policy';
import { OrderingOrderNotFoundException } from '@/shared/exceptions';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';
import { useClassProvider } from '@/common/utils/nest-provider.helpers';

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
				ApplicationExceptionFactory.create(
					OrderingOrderNotFoundException,
					{ cause: { id } },
				));
		const order = await this.emForContext().findOneOrFail(
			OrderSchema,
			{ uuid: id },
			{ failHandler },
		);

		return OrderResult.fromSchema(order);
	}

	async findRecent(
		options: PageOptions<OrderResult>,
	): Promise<OrderResult[]> {
		const page = normalizeReaderExternalPage(options.limit, options.offset);
		const orders = await this.emForContext().find(
			OrderSchema,
			{},
			{
				limit: page.limit,
				offset: page.offset,
				orderBy: { id: 'asc' },
			},
		);
		return orders.map((order) => OrderResult.fromSchema(order));
	}

	async findByUserId(
		userId: string,
		options: PageOptions<OrderResult>,
	): Promise<OrderResult[]> {
		const normalized = String(userId ?? '').trim();
		if (!normalized) return [];

		const page = normalizeReaderInternalPage(options.limit, options.offset);
		const orders = await this.emForContext().find(
			OrderSchema,
			{ userId: normalized },
			{
				limit: page.limit,
				offset: page.offset,
				orderBy: { id: 'asc' },
			},
		);
		return orders.map((order) => OrderResult.fromSchema(order));
	}

	async countAll(): Promise<number> {
		return await this.emForContext().count(OrderSchema, {});
	}
}

export const OrderReaderProvider = useClassProvider(
	IOrderReaderSymbol,
	OrderReader,
);
