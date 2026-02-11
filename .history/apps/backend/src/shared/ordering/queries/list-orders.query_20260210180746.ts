import type { OrderView } from '../readers/order.view';

export class ListOrdersQuery {
  constructor(public readonly limit: number) {}

  declare readonly __returnType?: OrderView[];
}
