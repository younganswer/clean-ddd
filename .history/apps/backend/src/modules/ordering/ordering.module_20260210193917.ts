import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { IOrderRepositorySymbol } from './domains/repositories/i.order.repository';
import { OrderRepository } from './infrastructure/repositories/order.repository';
import { OrderMapper } from './infrastructure/mappers/order.mapper';
import { CreateOrderHandler } from './application/commands/handlers/create-order.handler';
import { AttachPaymentToOrderHandler } from './application/commands/handlers/attach-payment-to-order.handler';
import { MarkOrderPaidHandler } from './application/commands/handlers/mark-order-paid.handler';
import { GetOrderHandler } from './application/queries/handlers/get-order.handler';
import { ListOrdersHandler } from './application/queries/handlers/list-orders.handler';
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
    CreateOrderHandler,
    AttachPaymentToOrderHandler,
    MarkOrderPaidHandler,
    GetOrderHandler,
    ListOrdersHandler,
  ],
  exports: [IOrderRepositorySymbol],
})
export class OrderingModule {}
