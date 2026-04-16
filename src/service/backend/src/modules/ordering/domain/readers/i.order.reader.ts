import type {
	PageOptions,
	RepositoryGetByIdOptions,
} from '@/lib/database/repository-get-options';
import type { OrderResult } from '@/modules/ordering/domain/readers/order.result';

export const IOrderReaderSymbol = Symbol('IOrderReader');

export interface IOrderReader {
	findById(id: string): Promise<OrderResult | null>;
	getById(
		id: string,
		options?: RepositoryGetByIdOptions,
	): Promise<OrderResult>;
	findRecent(options: PageOptions<OrderResult>): Promise<OrderResult[]>;
	findByUserId(
		userId: string,
		options: PageOptions<OrderResult>,
	): Promise<OrderResult[]>;
	countAll(): Promise<number>;
}
