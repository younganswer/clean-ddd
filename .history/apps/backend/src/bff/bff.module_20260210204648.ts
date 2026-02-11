import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { OrdersBffModule } from './orders/orders-bff.module';

@Module({
  imports: [CqrsModule, OrdersBffModule],
})
export class BffModule {}
