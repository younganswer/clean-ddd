import { GetOrderHandler } from './handlers/get-order.handler';
import { ListOrdersHandler } from './handlers/list-orders.handler';
import { ListOrdersByUserSubjectIdHandler } from './handlers/list-orders-by-user-subject-id.handler';

export const QueryHandlers = [
  GetOrderHandler,
  ListOrdersHandler,
  ListOrdersByUserSubjectIdHandler,
];
