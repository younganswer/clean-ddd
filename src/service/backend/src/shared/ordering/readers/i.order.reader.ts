import type { OrderView } from './order.view';

export const IOrderReaderSymbol = Symbol('IOrderReader');

export interface IOrderReader {
  findById(orderId: string): Promise<OrderView | null>;
  findRecent(limit: number, offset?: number): Promise<OrderView[]>;
  findByUserId(
    userId: string,
    limit: number,
    offset?: number,
  ): Promise<OrderView[]>;
  countAll(): Promise<number>;
}
