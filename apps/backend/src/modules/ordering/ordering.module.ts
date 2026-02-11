import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { IOrderRepositorySymbol } from './domains/repositories/i.order.repository';
import { OrderRepository } from './infrastructure/repositories/order.repository';
import { OrderMapper } from './infrastructure/mappers/order.mapper';
import { CommandHandlers } from './application/commands';
import { QueryHandlers } from './application/queries';
import { OrdersController } from './presentation/orders.controller';
import { OrderReaderProvider } from './infrastructure/readers/order.reader';

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
