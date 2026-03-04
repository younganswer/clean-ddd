import type { OrderView } from '@/shared/ordering/readers/order.view';

export const IOrderReaderSymbol = Symbol('IOrderReader');

export interface IOrderReader {
	findById(id: string): Promise<OrderView | null>;
	findRecent(limit: number, offset?: number): Promise<OrderView[]>;
	findByUserId(
		userId: string,
		limit: number,
		offset?: number,
	): Promise<OrderView[]>;
	countAll(): Promise<number>;
}
