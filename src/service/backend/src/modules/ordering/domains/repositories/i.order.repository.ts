import { Order } from '@/modules/ordering/domains/entities/aggregates/order/order.aggregate';
import type {
	RepositoryGetByIdOptions,
	RepositoryPageOptions,
} from '@/lib/database/repository-get-options';

export interface IOrderRepository {
	persist(order: Order): Promise<void>;
	findById(id: string): Promise<Order | null>;
	getById(id: string, options?: RepositoryGetByIdOptions): Promise<Order>;
	findRecent(options: RepositoryPageOptions<Order>): Promise<Order[]>;
	findByUserId(
		userId: string,
		options: RepositoryPageOptions<Order>,
	): Promise<Order[]>;
	countAll(): Promise<number>;
}

export const IOrderRepositorySymbol = Symbol('I_ORDER_REPOSITORY');
