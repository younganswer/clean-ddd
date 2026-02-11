import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { OrderDetailBffController } from './presentation/order-detail-bff.controller';
import { QueryHandlers } from './application/queries';

@Module({
  imports: [CqrsModule],
  controllers: [OrderDetailBffController],
  providers: [...QueryHandlers],
})
export class OrderDetailBffModule {}
