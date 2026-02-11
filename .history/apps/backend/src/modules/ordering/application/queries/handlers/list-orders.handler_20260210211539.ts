import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  ListOrdersQuery,
} from '../../../../../shared/ordering';
import {
  IOrderReaderSymbol,
  type IOrderReader,
} from '../../../../../shared/ordering/readers/i.order.reader';
import type { OrderView } from '../../../../../shared/ordering/readers/order.view';

@QueryHandler(ListOrdersQuery)
export class ListOrdersHandler implements IQueryHandler<ListOrdersQuery> {
  constructor(
    @Inject(IOrderReaderSymbol)
    private readonly orders: IOrderReader,
  ) {}

  async execute(query: ListOrdersQuery): Promise<OrderView[]> {
    return this.orders.findRecent(query.limit);
  }
}
