import { GetOrderBffHandler } from '@/bff/orders/application/queries/handlers/get-order-bff.handler';
import { ListOrdersBffHandler } from '@/bff/orders/application/queries/handlers/list-orders-bff.handler';

export const OrdersBffQueryHandlers = [
	GetOrderBffHandler,
	ListOrdersBffHandler,
];
