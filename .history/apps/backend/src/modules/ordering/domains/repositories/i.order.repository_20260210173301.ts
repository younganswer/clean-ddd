import { Order } from '../entities/aggregates/order/order.aggregate';

export interface IOrderRepository {
  create(input: {
    amount: number;
    currency: string;
    items?: Array<{ sku: string; quantity: number }>;
  }): Promise<Order>;

  findById(orderId: string): Promise<Order | null>;
  findRecent(limit: number): Promise<Order[]>;

  attachPayment(orderId: string, paymentId: string): Promise<void>;
  markPaid(orderId: string): Promise<void>;
}

export const IOrderRepositorySymbol = Symbol('I_ORDER_REPOSITORY');
