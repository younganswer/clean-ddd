import { RepositoryGetByIdOptions } from '@/lib/database/repository-get-options';
import type { OrderResult } from '@/modules/ordering/domains/readers/order.result';

export const IOrderReaderSymbol = Symbol('IOrderReader');

export interface IOrderReader {
	findById(id: string): Promise<OrderResult | null>;
	getById(
		id: string,
		options?: RepositoryGetByIdOptions,
	): Promise<OrderResult>;
	findRecent(limit: number, offset?: number): Promise<OrderResult[]>;
	findByUserId(
		userId: string,
		limit: number,
		offset?: number,
	): Promise<OrderResult[]>;
	countAll(): Promise<number>;
}
