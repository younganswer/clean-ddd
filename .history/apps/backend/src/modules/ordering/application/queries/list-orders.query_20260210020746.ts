import { Query } from '@nestjs/cqrs';
import type { OrderView } from './order.view';

export class ListOrdersQuery extends Query<OrderView[]> {
  constructor(public readonly limit: number) {
    super();
  }
}
