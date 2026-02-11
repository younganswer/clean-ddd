import { Module } from '@nestjs/common';
import { ShippingEventsHandler } from './application/shipping-events.handler';
import { ShipmentRepository } from './infrastructure/repositories/shipment.repository';
import { ShipmentsController } from './presentation/shipments.controller';

@Module({
  imports: [],
  controllers: [ShipmentsController],
  providers: [ShipmentRepository, ShippingEventsHandler],
  exports: [ShippingEventsHandler],
})
export class ShippingModule {}
