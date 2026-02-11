import { Module } from '@nestjs/common';

import { OrdersBffModule } from './orders/orders-bff.module';

@Module({
  imports: [OrdersBffModule],
})
export class BffModule {}
