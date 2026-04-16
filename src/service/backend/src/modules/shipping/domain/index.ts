import { ShippingHandlers } from '@/modules/shipping/application';
import { ShipmentCreationService } from '@/modules/shipping/domain/services/shipment-creation.service';
import { ShipmentMapper } from '@/modules/shipping/infrastructure/mappers/shipment.mapper';
import { ShipmentReaderProvider } from '@/modules/shipping/infrastructure/readers/shipment.reader';
import { ShipmentRepositoryProviders } from '@/modules/shipping/infrastructure/repositories/shipment.repository';

export const ShippingProviders = [
	ShipmentMapper,
	...ShipmentRepositoryProviders,
	ShipmentCreationService,
	ShipmentReaderProvider,
	...ShippingHandlers,
];
