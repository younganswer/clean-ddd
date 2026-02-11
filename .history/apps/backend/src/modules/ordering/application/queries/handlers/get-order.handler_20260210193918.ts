import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetOrderQuery,
  IOrderReaderSymbol,
  type IOrderReader,
  type OrderView,
} from '../../../../../shared/ordering';

@QueryHandler(GetOrderQuery)
export class GetOrderHandler implements IQueryHandler<GetOrderQuery> {
  constructor(
    @Inject(IOrderReaderSymbol)
    private readonly orders: IOrderReader,
  ) {}

  async execute(query: GetOrderQuery): Promise<OrderView | null> {
    return this.orders.findById(query.orderId);
  }
}
