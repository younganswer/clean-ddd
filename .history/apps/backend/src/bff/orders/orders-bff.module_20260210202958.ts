import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { OrdersBffController } from './presentation/orders-bff.controller';
import { CreateOrderBffHandler } from './application/commands/handlers/create-order-bff.handler';
import { GetOrderBffHandler } from './application/queries/handlers/get-order-bff.handler';
import { ListOrdersBffHandler } from './application/queries/handlers/list-orders-bff.handler';

@Module({
  imports: [CqrsModule],
  controllers: [OrdersBffController],
  providers: [CreateOrderBffHandler, GetOrderBffHandler, ListOrdersBffHandler],
})
export class OrdersBffModule {}
