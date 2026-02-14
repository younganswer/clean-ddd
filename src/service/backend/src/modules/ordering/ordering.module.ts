import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { IOrderRepositorySymbol } from '@/modules/ordering/domains/repositories/i.order.repository';
import { OrderRepository } from '@/modules/ordering/infrastructure/repositories/order.repository';
import { OrderMapper } from '@/modules/ordering/infrastructure/mappers/order.mapper';
import { CommandHandlers } from '@/modules/ordering/application/commands';
import { QueryHandlers } from '@/modules/ordering/application/queries';
import { OrdersController } from '@/modules/ordering/presentation/orders.controller';
import { OrderReaderProvider } from '@/modules/ordering/infrastructure/readers/order.reader';

@Module({
  imports: [CqrsModule],
  controllers: [OrdersController],
  providers: [
    OrderMapper,
    OrderRepository,
    {
      provide: IOrderRepositorySymbol,
      useExisting: OrderRepository,
    },
    OrderReaderProvider,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [IOrderRepositorySymbol],
})
export class OrderingModule {}
