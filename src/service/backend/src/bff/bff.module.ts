import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { OrdersBffModule } from '@/bff/orders/orders-bff.module';
import { OrderDetailBffModule } from '@/bff/order-detail/order-detail-bff.module';
import { CheckoutBffModule } from '@/bff/checkout/checkout-bff.module';
import { DashboardBffModule } from '@/bff/dashboard/dashboard-bff.module';
import { GraphBffModule } from '@/bff/graph/graph-bff.module';
import { SystemConceptsBffModule } from '@/bff/system-concepts/system-concepts-bff.module';

@Module({
  imports: [
    CqrsModule,
    OrdersBffModule,
    OrderDetailBffModule,
    CheckoutBffModule,
    DashboardBffModule,
    GraphBffModule,
    SystemConceptsBffModule,
  ],
})
export class BffModule {}
