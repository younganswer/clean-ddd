import { GetOrderHandler } from '@/modules/ordering/application/queries/handlers/get-order.handler';
import { ListOrdersHandler } from '@/modules/ordering/application/queries/handlers/list-orders.handler';
import { ListOrdersByUserSubjectIdHandler } from '@/modules/ordering/application/queries/handlers/list-orders-by-user-subject-id.handler';

export const OrderingQueryHandlers = [
	GetOrderHandler,
	ListOrdersHandler,
	ListOrdersByUserSubjectIdHandler,
];
