import { Order } from '@/modules/ordering/domains/entities/aggregates/order/order.aggregate';

export interface IOrderRepository {
	persist(order: Order): Promise<void>;
	findById(orderId: string): Promise<Order | null>;
	findRecent(limit: number, offset?: number): Promise<Order[]>;
	findByUserId(
		userId: string,
		limit: number,
		offset?: number,
	): Promise<Order[]>;
	countAll(): Promise<number>;
}

export const IOrderRepositorySymbol = Symbol('I_ORDER_REPOSITORY');
