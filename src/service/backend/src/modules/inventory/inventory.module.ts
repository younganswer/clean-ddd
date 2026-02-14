import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ReserveInventoryForOrderRequestedHandler } from '@/modules/inventory/application/events/handlers/reserve-inventory-for-order-requested.handler';
import { ReserveInventoryForOrderHandler } from '@/modules/inventory/application/commands/handlers/reserve-inventory-for-order.handler';
import { GetInventoryItemHandler } from '@/modules/inventory/application/queries/handlers/get-inventory-item.handler';
import { ListInventoryItemsHandler } from '@/modules/inventory/application/queries/handlers/list-inventory-items.handler';
import { ListInventoryReservationsHandler } from '@/modules/inventory/application/queries/handlers/list-inventory-reservations.handler';
import { IInventoryRepositorySymbol } from '@/modules/inventory/domains/repositories/i.inventory.repository';
import { InventoryItemMapper } from '@/modules/inventory/infrastructure/mappers/inventory-item.mapper';
import { InventoryReservationMapper } from '@/modules/inventory/infrastructure/mappers/inventory-reservation.mapper';
import { InventoryRepository } from '@/modules/inventory/infrastructure/repositories/inventory.repository';
import { InventoryController } from '@/modules/inventory/presentation/inventory.controller';
import { InventoryReaderProvider } from '@/modules/inventory/infrastructure/readers/inventory.reader';

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
