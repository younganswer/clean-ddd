import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { IOrderRepositorySymbol } from './domains/repositories/i.order.repository';
import { OrderRepository } from './infrastructure/repositories/order.repository';
import { OrderMapper } from './infrastructure/mappers/order.mapper';
import { CreateOrderHandler } from './application/commands/handlers/create-order.handler';
import { GetOrderHandler } from './application/queries/handlers/get-order.handler';
import { ListOrdersHandler } from './application/queries/handlers/list-orders.handler';
import { OrdersController } from './presentation/orders.controller';

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
    CreateOrderHandler,
    GetOrderHandler,
    ListOrdersHandler,
  ],
  exports: [IOrderRepositorySymbol],
})
export class OrderingModule {}
