import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ShippingEventsHandler } from './application/shipping-events.handler';
import { IShipmentRepositorySymbol } from './domains/repositories/i.shipment.repository';
import { GetShipmentByOrderHandler } from './application/queries/handlers/get-shipment-by-order.handler';
import { GetShipmentHandler } from './application/queries/handlers/get-shipment.handler';
import { ListShipmentsHandler } from './application/queries/handlers/list-shipments.handler';
import { ShipmentMapper } from './infrastructure/mappers/shipment.mapper';
import { ShipmentRepository } from './infrastructure/repositories/shipment.repository';
import { ShipmentsController } from './presentation/shipments.controller';

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
    ListShipmentsHandler,
    GetShipmentHandler,
    GetShipmentByOrderHandler,
    ShippingEventsHandler,
  ],
  exports: [ShippingEventsHandler],
})
export class ShippingModule {}
