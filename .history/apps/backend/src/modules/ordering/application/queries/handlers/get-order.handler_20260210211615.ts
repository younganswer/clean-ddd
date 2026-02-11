import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetOrderQuery } from '../../../../../shared/ordering/queries/get-order.query';
import {
  IOrderReaderSymbol,
  type IOrderReader,
} from '../../../../../shared/ordering/readers/i.order.reader';
import type { OrderView } from '../../../../../shared/ordering/readers/order.view';

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
