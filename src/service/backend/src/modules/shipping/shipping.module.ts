import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateShipmentForOrderRequestedHandler } from '@/modules/shipping/application/events/handlers/create-shipment-for-order-requested.handler';
import { CreateShipmentForOrderHandler } from '@/modules/shipping/application/commands/handlers/create-shipment-for-order.handler';
import { IShipmentReaderSymbol } from '@/modules/shipping/domains/readers/i.shipment.reader';
import { IShipmentRepositorySymbol } from '@/modules/shipping/domains/repositories/i.shipment.repository';
import { GetShipmentByOrderHandler } from '@/modules/shipping/application/queries/handlers/get-shipment-by-order.handler';
import { GetShipmentHandler } from '@/modules/shipping/application/queries/handlers/get-shipment.handler';
import { ListShipmentsHandler } from '@/modules/shipping/application/queries/handlers/list-shipments.handler';
import { ShipmentMapper } from '@/modules/shipping/infrastructure/mappers/shipment.mapper';
import { ShipmentRepository } from '@/modules/shipping/infrastructure/repositories/shipment.repository';
import { ShipmentsController } from '@/modules/shipping/presentation/shipments.controller';
import { ShipmentReaderProvider } from '@/modules/shipping/infrastructure/readers/shipment.reader';
import { ShipmentCreationService } from '@/modules/shipping/domains/services/shipment-creation.service';

@Module({
	imports: [CqrsModule],
	controllers: [ShipmentsController],
	providers: [
		ShipmentMapper,
		ShipmentRepository,
		{
			provide: IShipmentRepositorySymbol,
			useExisting: ShipmentRepository,
		},
		ShipmentCreationService,
		ShipmentReaderProvider,
		CreateShipmentForOrderHandler,
		ListShipmentsHandler,
		GetShipmentHandler,
		GetShipmentByOrderHandler,
		CreateShipmentForOrderRequestedHandler,
	],
	exports: [IShipmentReaderSymbol],
})
export class ShippingModule {}
