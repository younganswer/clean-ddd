import { Query } from '@nestjs/cqrs';
import type { OrderView } from './order.view';

export class GetOrderQuery extends Query<OrderView | null> {
  constructor(public readonly orderId: string) {
    super();
  }
}
