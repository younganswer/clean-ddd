import type { OrderView } from './dto/order.view';

export const IOrderReaderSymbol = Symbol('IOrderReader');

export interface IOrderReader {
  findById(orderId: string): Promise<OrderView | null>;
  findRecent(limit: number): Promise<OrderView[]>;
}
