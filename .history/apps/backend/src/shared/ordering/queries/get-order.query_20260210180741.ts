import type { OrderView } from '../readers/order.view';

export class GetOrderQuery {
  constructor(public readonly orderId: string) {}

  // used by Nest CQRS to infer return type at call-sites
  declare readonly __returnType?: OrderView | null;
}
