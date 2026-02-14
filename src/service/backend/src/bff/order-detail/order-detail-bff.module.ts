import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { OrderDetailBffController } from '@/bff/order-detail/presentation/order-detail-bff.controller';
import { QueryHandlers } from '@/bff/order-detail/application/queries';

@Module({
  imports: [CqrsModule],
  controllers: [OrderDetailBffController],
  providers: [...QueryHandlers],
})
export class OrderDetailBffModule {}
