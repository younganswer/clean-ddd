import { Module } from '@nestjs/common';
import { InventoryEventsHandler } from './application/inventory-events.handler';
import { InventoryRepository } from './infrastructure/repositories/inventory.repository';
import { InventoryController } from './presentation/inventory.controller';

@Module({
  imports: [],
  controllers: [InventoryController],
  providers: [InventoryRepository, InventoryEventsHandler],
  exports: [InventoryEventsHandler],
})
export class InventoryModule {}
