import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { OrderDetailBffController } from './presentation/order-detail-bff.controller';
import { GetOrderDetailBffHandler } from './application/queries/handlers/get-order-detail-bff.handler';

@Module({
  imports: [CqrsModule],
  controllers: [OrderDetailBffController],
  providers: [GetOrderDetailBffHandler],
})
export class OrderDetailBffModule {}
