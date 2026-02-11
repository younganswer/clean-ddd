import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IOrderReaderSymbol,
  ListOrdersQuery,
  type IOrderReader,
  type OrderView,
} from '../../../../../shared/ordering';

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
