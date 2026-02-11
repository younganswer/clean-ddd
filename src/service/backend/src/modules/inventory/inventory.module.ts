import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
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
import { InventoryReaderProvider } from './infrastructure/readers/inventory.reader';

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
    InventoryReaderProvider,
    ReserveInventoryForOrderHandler,
    ListInventoryItemsHandler,
    GetInventoryItemHandler,
    ListInventoryReservationsHandler,
    ReserveInventoryForOrderRequestedHandler,
  ],
})
export class InventoryModule {}
