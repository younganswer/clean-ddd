import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { OrdersBffModule } from './orders/orders-bff.module';
import { OrderDetailBffModule } from './order-detail/order-detail-bff.module';
import { CheckoutBffModule } from './checkout/checkout-bff.module';
import { DashboardBffModule } from './dashboard/dashboard-bff.module';

@Module({
  imports: [
    CqrsModule,
    OrdersBffModule,
    OrderDetailBffModule,
    CheckoutBffModule,
    DashboardBffModule,
  ],
})
export class BffModule {}
