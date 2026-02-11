import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { OrderRepository } from './infrastructure/repositories/order.repository';
import { CreateOrderHandler } from './application/commands/handlers/create-order.handler';
import { OrdersController } from './presentation/orders.controller';

@Module({
  imports: [CqrsModule],
  controllers: [OrdersController],
  providers: [OrderRepository, CreateOrderHandler],
  exports: [OrderRepository],
})
export class OrderingModule {}
