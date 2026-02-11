import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateShipmentForOrderRequestedHandler } from './application/events/handlers/create-shipment-for-order-requested.handler';
import { CreateShipmentForOrderHandler } from './application/commands/handlers/create-shipment-for-order.handler';
import { IShipmentRepositorySymbol } from './domains/repositories/i.shipment.repository';
import { GetShipmentByOrderHandler } from './application/queries/handlers/get-shipment-by-order.handler';
import { GetShipmentHandler } from './application/queries/handlers/get-shipment.handler';
import { ListShipmentsHandler } from './application/queries/handlers/list-shipments.handler';
import { ShipmentMapper } from './infrastructure/mappers/shipment.mapper';
import { ShipmentRepository } from './infrastructure/repositories/shipment.repository';
import { ShipmentsController } from './presentation/shipments.controller';
import { ShipmentReaderProvider } from './infrastructure/readers/shipment.reader';

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
    ShipmentReaderProvider,
    CreateShipmentForOrderHandler,
    ListShipmentsHandler,
    GetShipmentHandler,
    GetShipmentByOrderHandler,
    CreateShipmentForOrderRequestedHandler,
  ],
})
export class ShippingModule {}
