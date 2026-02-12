import { Order } from '../entities/aggregates/order/order.aggregate';

export interface IOrderRepository {
  create(input: {
    amount: number;
    currency: string;
    items?: Array<{ sku: string; quantity: number }>;
    userSubjectId?: string | null;
  }): Promise<Order>;

  findById(orderId: string): Promise<Order | null>;
  findRecent(limit: number, offset?: number): Promise<Order[]>;
  findByUserSubjectId(
    userSubjectId: string,
    limit: number,
    offset?: number,
  ): Promise<Order[]>;
  countAll(): Promise<number>;

  attachPayment(orderId: string, paymentId: string): Promise<void>;
  markPaid(orderId: string): Promise<void>;
}

export const IOrderRepositorySymbol = Symbol('I_ORDER_REPOSITORY');
