import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { InventoryEventsHandler } from './application/inventory-events.handler';
import { ReserveInventoryForOrderRequestedHandler } from './application/events/handlers/reserve-inventory-for-order-requested.handler';
import { ReserveInventoryForOrderHandler } from './application/commands/handlers/reserve-inventory-for-order.handler';
import { GetInventoryItemHandler } from './application/queries/handlers/get-inventory-item.handler';
import { ListInventoryItemsHandler } from './application/queries/handlers/list-inventory-items.handler';
import { ListInventoryReservationsHandler } from './application/queries/handlers/list-inventory-reservations.handler';
import { IInventoryRepositorySymbol } from './domains/repositories/i.inventory.repository';
import { InventoryItemMapper } from './infrastructure/mappers/inventory-item.mapper';
import { InventoryReservationMapper } from './infrastructure/mappers/inventory-reservation.mapper';
import { InventoryRepository } from './infrastructure/repositories/inventory.repository';
import { InventoryController } from './presentation/inventory.controller';

@Module({
  imports: [CqrsModule],
  controllers: [InventoryController],
  providers: [
    InventoryItemMapper,
    InventoryReservationMapper,
    InventoryRepository,
    {
      provide: IInventoryRepositorySymbol,
      useExisting: InventoryRepository,
    },
    ReserveInventoryForOrderHandler,
    ListInventoryItemsHandler,
    GetInventoryItemHandler,
    ListInventoryReservationsHandler,
    InventoryEventsHandler,
    ReserveInventoryForOrderRequestedHandler,
  ],
  exports: [InventoryEventsHandler],
})
export class InventoryModule {}
