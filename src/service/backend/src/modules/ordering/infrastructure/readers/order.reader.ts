import { Inject, Injectable } from '@nestjs/common';
import {
  IOrderReaderSymbol,
  type IOrderReader,
} from '../../../../shared/ordering/readers/i.order.reader';
import type { OrderView } from '../../../../shared/ordering/readers/order.view';
import { IOrderRepositorySymbol } from '../../domains/repositories/i.order.repository';
import type { IOrderRepository } from '../../domains/repositories/i.order.repository';

@Injectable()
export class OrderReader implements IOrderReader {
  constructor(
    @Inject(IOrderRepositorySymbol)
    private readonly orders: IOrderRepository,
  ) {}

  async findById(orderId: string): Promise<OrderView | null> {
    const order = await this.orders.findById(orderId);
    if (!order) return null;
    return this.toView(order);
  }

  async findRecent(limit: number, offset: number = 0): Promise<OrderView[]> {
    const safeLimit = Math.min(50, Math.max(1, Number(limit ?? 20)));
    const safeOffset = Math.max(0, Number(offset ?? 0) || 0);
    const orders = await this.orders.findRecent(safeLimit, safeOffset);
    return orders.map((o) => this.toView(o));
  }

  async countAll(): Promise<number> {
    return await this.orders.countAll();
  }

  private toView(order: {
    id: string;
    status: OrderView['status'];
    amount: number;
    currency: string;
    items: OrderView['items'];
    paymentId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): OrderView {
    return {
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      items: order.items,
      paymentId: order.paymentId,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}

export const OrderReaderProvider = {
  provide: IOrderReaderSymbol,
  useClass: OrderReader,
};
