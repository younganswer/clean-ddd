import { CreateShipmentForOrderHandler } from '@/modules/shipping/application/commands/handlers/create-shipment-for-order.handler';
import { CreateShipmentForOrderRequestedHandler } from '@/modules/shipping/application/events/handlers/create-shipment-for-order-requested.handler';
import { GetShipmentByOrderHandler } from '@/modules/shipping/application/queries/handlers/get-shipment-by-order.handler';
import { GetShipmentHandler } from '@/modules/shipping/application/queries/handlers/get-shipment.handler';
import { ListShipmentsHandler } from '@/modules/shipping/application/queries/handlers/list-shipments.handler';

export const ShippingHandlers = [
	CreateShipmentForOrderHandler,
	ListShipmentsHandler,
	GetShipmentHandler,
	GetShipmentByOrderHandler,
	CreateShipmentForOrderRequestedHandler,
];
