import type { OrderResult } from '@/shared/ordering/readers/order.result';

export const IOrderReaderSymbol = Symbol('IOrderReader');

export interface IOrderReader {
	findById(id: string): Promise<OrderResult | null>;
	findRecent(limit: number, offset?: number): Promise<OrderResult[]>;
	findByUserId(
		userId: string,
		limit: number,
		offset?: number,
	): Promise<OrderResult[]>;
	countAll(): Promise<number>;
}
