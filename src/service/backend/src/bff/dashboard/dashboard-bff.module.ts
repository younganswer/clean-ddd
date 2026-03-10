import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { DashboardBffController } from '@/bff/dashboard/presentation/dashboard-bff.controller';
import { QueryHandlers } from '@/bff/dashboard/application/queries';
import { InventoryModule } from '@/modules/inventory/inventory.module';
import { OrderingModule } from '@/modules/ordering/ordering.module';
import { PaymentsModule } from '@/modules/payments/payments.module';
import { ShippingModule } from '@/modules/shipping/shipping.module';

@Module({
	imports: [
		CqrsModule,
		OrderingModule,
		PaymentsModule,
		ShippingModule,
		InventoryModule,
	],
	controllers: [DashboardBffController],
	providers: [...QueryHandlers],
})
export class DashboardBffModule {}
