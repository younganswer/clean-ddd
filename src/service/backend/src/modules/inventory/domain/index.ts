import { InventoryHandlers } from '@/modules/inventory/application';
import { InventoryReservationService } from '@/modules/inventory/domain/services/inventory-reservation.service';
import { InventoryItemMapper } from '@/modules/inventory/infrastructure/mappers/inventory-item.mapper';
import { InventoryReservationMapper } from '@/modules/inventory/infrastructure/mappers/inventory-reservation.mapper';
import { InventoryReaderProvider } from '@/modules/inventory/infrastructure/readers/inventory.reader';
import { InventoryItemRepositoryProviders } from '@/modules/inventory/infrastructure/repositories/inventory.repository';
import { InventoryReservationRepositoryProviders } from '@/modules/inventory/infrastructure/repositories/inventory-reservation.repository';

export const InventoryProviders = [
	InventoryItemMapper,
	InventoryReservationMapper,
	...InventoryItemRepositoryProviders,
	...InventoryReservationRepositoryProviders,
	InventoryReaderProvider,
	InventoryReservationService,
	...InventoryHandlers,
];
