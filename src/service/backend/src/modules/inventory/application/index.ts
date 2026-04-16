import { ReleaseInventoryForOrderHandler } from '@/modules/inventory/application/commands/handlers/release-inventory-for-order.handler';
import { ReserveInventoryForOrderHandler } from '@/modules/inventory/application/commands/handlers/reserve-inventory-for-order.handler';
import { ReserveInventoryForOrderRequestedHandler } from '@/modules/inventory/application/events/handlers/reserve-inventory-for-order-requested.handler';
import { GetInventoryItemHandler } from '@/modules/inventory/application/queries/handlers/get-inventory-item.handler';
import { ListInventoryItemsHandler } from '@/modules/inventory/application/queries/handlers/list-inventory-items.handler';
import { ListInventoryReservationsHandler } from '@/modules/inventory/application/queries/handlers/list-inventory-reservations.handler';

export const InventoryHandlers = [
	ReserveInventoryForOrderHandler,
	ReleaseInventoryForOrderHandler,
	ListInventoryItemsHandler,
	GetInventoryItemHandler,
	ListInventoryReservationsHandler,
	ReserveInventoryForOrderRequestedHandler,
];
