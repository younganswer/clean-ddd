import { Order } from '@/modules/ordering/domains/entities/aggregates/order/order.aggregate';
import type { RepositoryGetByIdOptions } from '@/lib/database/repository-get-options';

export interface IOrderRepository {
	persist(order: Order): Promise<void>;
	findById(orderId: string): Promise<Order | null>;
	getById(
		orderId: string,
		options?: RepositoryGetByIdOptions,
	): Promise<Order>;
	findRecent(limit: number, offset?: number): Promise<Order[]>;
	findByUserId(
		userId: string,
		limit: number,
		offset?: number,
	): Promise<Order[]>;
	countAll(): Promise<number>;
}

export const IOrderRepositorySymbol = Symbol('I_ORDER_REPOSITORY');
